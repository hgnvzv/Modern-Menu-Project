// Temporary harness — inspects the admin items thumbnails in a real browser.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;
const OUT = "/tmp/qrcheck";

const proc = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    `--user-data-dir=${OUT}/profile2`,
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let id = 0;
const pending = new Map();
const events = [];
let ws;

const send = (method, params = {}) => {
  ws.send(JSON.stringify({ id: ++id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};

async function main() {
  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    const list = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      .then((r) => r.json())
      .catch(() => []);
    target = list.find((t) => t.type === "page");
    if (!target) await sleep(250);
  }
  await new Promise((res, rej) => {
    ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = res;
    ws.onerror = () => rej(new Error("ws"));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
      } else if (m.method) for (const cb of [...events]) cb(m);
    };
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable").catch(() => {});
  await send("Network.enable").catch(() => {});
  const errors = [];
  events.push((m) => {
    if (m.method === "Network.loadingFailed")
      errors.push(
        `netfail ${m.params.type}: ${m.params.errorText} ${m.params.url ?? ""}`,
      );
    if (m.method === "Network.responseReceived" && m.params.type === "Image") {
      const r = m.params.response;
      if (r.status >= 400) errors.push(`img ${r.status} ${r.url}`);
    }
  });
  events.push((m) => {
    if (m.method === "Log.entryAdded" && m.entry)
      errors.push(`${m.entry.level}: ${m.entry.text} ${m.entry.url ?? ""}`);
    if (m.method === "Runtime.exceptionThrown")
      errors.push(
        "exception: " + (m.params?.exceptionDetails?.exception?.description ?? ""),
      );
  });

  const evalJs = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const navigate = (url) =>
    new Promise(async (res) => {
      const h = (m) => {
        if (m.method === "Page.loadEventFired") {
          events.splice(events.indexOf(h), 1);
          res();
        }
      };
      events.push(h);
      await send("Page.navigate", { url });
      setTimeout(res, 8000);
    });
  const waitFor = async (expr, ms = 12000) => {
    const s = Date.now();
    while (Date.now() - s < ms) {
      if (await evalJs(expr)) return true;
      await sleep(250);
    }
    return false;
  };

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const login = await fetch("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "PiAdmin@2026" }),
  }).then((r) => r.json());

  await navigate("http://localhost:5173/admin/login");
  await evalJs(
    `sessionStorage.setItem('pi.admin.token', ${JSON.stringify(login.token)});sessionStorage.setItem('pi.admin.username','admin');`,
  );
  await navigate("http://localhost:5173/admin");
  await waitFor("document.body.innerText.length > 40");
  await sleep(1200);

  const report = await evalJs(`(() => {
    const imgs = [...document.querySelectorAll('.table-admin img.thumb, .panel img')];
    return JSON.stringify({
      tab: document.querySelector('h2')?.innerText,
      count: imgs.length,
      rows: document.querySelectorAll('.table-admin tbody tr').length,
      items: imgs.slice(0, 6).map((i) => ({
        src: i.getAttribute('src'),
        currentSrc: i.currentSrc,
        complete: i.complete,
        natural: [i.naturalWidth, i.naturalHeight],
        box: [Math.round(i.getBoundingClientRect().width), Math.round(i.getBoundingClientRect().height)],
        display: getComputedStyle(i).display,
        objectFit: getComputedStyle(i).objectFit,
      })),
    });
  })()`);

  const fetchProbe = await evalJs(`(async () => {
    const src = document.querySelector('.table-admin img.thumb')?.getAttribute('src');
    if (!src) return 'no src';
    const r = await fetch(src, { cache: 'no-store' });
    const t = await r.text();
    return JSON.stringify({ src, status: r.status, type: r.headers.get('content-type'), head: t.slice(0, 120) });
  })()`);

  writeFileSync(`${OUT}/items.png`, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
  console.log(JSON.stringify({ report, fetchProbe, errors: errors.slice(0, 12) }, null, 2));
  ws.close();
  proc.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error("FAILED", e);
  proc.kill();
  process.exit(1);
});
