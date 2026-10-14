import { computed, ref } from "vue";
import type { ServiceType } from "../types";
import {
  establishSession,
  fetchServiceState,
  readQrTokenFromUrl,
  readSession,
  submitRequest,
} from "../services/api";

/* Module-level singleton for the table/guest session + service requests.
   The backend issues the session from a verified QR token and returns an
   ABSOLUTE server expiry timestamp; the client only counts down toward it and
   never trusts its own clock for authorization. Waiter/bill calls hit the real
   API — success is reported only from the server's response. */

type SessionStatus =
  | "idle"
  | "checking"
  | "active"
  | "expired"
  | "invalid"
  | "error";
type SubmitStatus = "idle" | "sending" | "sent" | "error";

const sessionStatus = ref<SessionStatus>("idle");
const tableLabel = ref<string | null>(null);
const expiresAt = ref<number | null>(null);
const remainingMs = ref(0);

const serviceEnabled = ref(false);
const availabilityReady = ref(false);

/* شاشة الترحيب: تظهر مؤقتاً بعد مسح الزبون لرمز QR بنجاح. */
const welcomeVisible = ref(false);

const submitStates = ref<Record<ServiceType, SubmitStatus>>({
  waiter: "idle",
  bill: "idle",
});
const submitMessages = ref<Record<ServiceType, string | null>>({
  waiter: null,
  bill: null,
});
const lastSubmittedAt = ref<Record<ServiceType, number>>({
  waiter: 0,
  bill: 0,
});
const THROTTLE_MS = 3000;

let timer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

function stopTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function recompute(): void {
  if (expiresAt.value == null) {
    remainingMs.value = 0;
    return;
  }
  const left = expiresAt.value - Date.now();
  remainingMs.value = left > 0 ? left : 0;
  if (left <= 0 && sessionStatus.value === "active") {
    sessionStatus.value = "expired";
    stopTimer();
  }
}

function startTimer(): void {
  stopTimer();
  recompute();
  timer = setInterval(recompute, 1000);
}

function applySession(
  active: boolean,
  label: string | null,
  exp: number | null,
): void {
  tableLabel.value = label;
  if (active && exp != null) {
    sessionStatus.value = "active";
    expiresAt.value = exp;
    startTimer();
  } else {
    sessionStatus.value = "idle";
    expiresAt.value = null;
    remainingMs.value = 0;
    stopTimer();
  }
}

async function refreshAvailability(): Promise<void> {
  const res = await fetchServiceState();
  if (res.ok) {
    serviceEnabled.value = res.data.serviceEnabled;
    availabilityReady.value = true;
  }
}

export function useGuestSession() {
  async function init(): Promise<void> {
    if (initialized) return;
    initialized = true;
    await refreshAvailability();

    const token = readQrTokenFromUrl();
    if (token) {
      sessionStatus.value = "checking";
      const res = await establishSession(token);
      if (res.ok) {
        applySession(res.data.active, res.data.tableLabel, res.data.expiresAt);
        if (res.data.active) welcomeVisible.value = true;
      } else if (res.status === 404) {
        sessionStatus.value = "invalid";
      } else {
        sessionStatus.value = "error";
      }
      return;
    }

    // No QR in the URL: try to restore an existing cookie session.
    sessionStatus.value = "checking";
    const res = await readSession();
    if (res.ok) {
      applySession(res.data.active, res.data.tableLabel, res.data.expiresAt);
    } else {
      sessionStatus.value = "error";
    }
  }

  async function rescanDone(): Promise<void> {
    // Re-run init after the URL gains a ?qr= token (dev/testing helper).
    initialized = false;
    await init();
  }

  function canSubmit(type: ServiceType): boolean {
    return (
      sessionStatus.value === "active" &&
      serviceEnabled.value &&
      submitStates.value[type] !== "sending" &&
      Date.now() - lastSubmittedAt.value[type] > THROTTLE_MS
    );
  }

  async function submit(type: ServiceType): Promise<void> {
    if (submitStates.value[type] === "sending") return;
    if (sessionStatus.value !== "active") return;
    if (!serviceEnabled.value) {
      submitStates.value[type] = "error";
      submitMessages.value[type] = "الخدمة متوقفة حالياً من الإدارة.";
      return;
    }

    submitStates.value[type] = "sending";
    submitMessages.value[type] = null;
    const res = await submitRequest(type);

    if (res.ok) {
      submitStates.value[type] = "sent";
      submitMessages.value[type] =
        type === "waiter"
          ? "تم إرسال طلب النادل إلى الطاولة."
          : "تم إرسال طلب الحساب.";
      lastSubmittedAt.value[type] = Date.now();
    } else {
      submitStates.value[type] = "error";
      if (res.status === 403) {
        submitMessages.value[type] = "الخدمة متوقفة حالياً من الإدارة.";
        void refreshAvailability();
      } else if (res.status === 401) {
        submitMessages.value[type] = "انتهت صلاحية الجلسة، أعد مسح رمز QR.";
        sessionStatus.value = "expired";
        stopTimer();
      } else {
        submitMessages.value[type] = res.message || "تعذّر إرسال الطلب.";
      }
    }
  }

  function resetSubmit(type: ServiceType): void {
    submitStates.value[type] = "idle";
    submitMessages.value[type] = null;
  }

  const isTableVerified = computed(() => sessionStatus.value === "active");
  const ordered = computed(() => !serviceEnabled.value);

  return {
    sessionStatus,
    tableLabel,
    expiresAt,
    remainingMs,
    serviceEnabled,
    availabilityReady,
    welcomeVisible,
    submitStates,
    submitMessages,
    isTableVerified,
    ordered,
    init,
    rescanDone,
    canSubmit,
    submit,
    resetSubmit,
    refreshAvailability,
  };
}
