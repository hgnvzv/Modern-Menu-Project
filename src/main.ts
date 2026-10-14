import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

// Bootstrap 5 (RTL build for Arabic-first layout) — used for utilities + forms.
import "bootstrap/dist/css/bootstrap.rtl.min.css";
// Bootstrap Icons — icon font.
import "bootstrap-icons/font/bootstrap-icons.css";
// Pi Game Center design system (loads after Bootstrap to override).
import "./style.css";

createApp(App).use(router).mount("#app");
