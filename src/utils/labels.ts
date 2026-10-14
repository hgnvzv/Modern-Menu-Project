import type { ServiceType } from "../types";

/* Centralized Arabic labels/icons so copy lives in one place. */

export const serviceLabels: Record<ServiceType, string> = {
  waiter: "طلب النادل",
  bill: "طلب الحساب",
};

export const serviceIcons: Record<ServiceType, string> = {
  waiter: "bi-person-raising-hand",
  bill: "bi-receipt",
};

export type SessionTone = "ok" | "warn" | "danger" | "muted";

export interface SessionView {
  tone: SessionTone;
  icon: string;
  label: string;
  hint: string | null;
}

export function sessionView(
  status: "idle" | "checking" | "active" | "expired" | "invalid" | "error",
  remaining: string,
  tableLabel: string | null,
): SessionView {
  switch (status) {
    case "active":
      return {
        tone: "ok",
        icon: "bi-check-circle",
        label: tableLabel ? `الطاولة ${tableLabel}` : "جلسة نشطة",
        hint: `متبقٍّ ${remaining}`,
      };
    case "checking":
      return {
        tone: "muted",
        icon: "bi-hourglass-split",
        label: "جارٍ التحقق…",
        hint: null,
      };
    case "expired":
      return {
        tone: "warn",
        icon: "bi-clock-history",
        label: "انتهت الجلسة",
        hint: "أعد مسح رمز QR في الطاولة.",
      };
    case "invalid":
      return {
        tone: "danger",
        icon: "bi-x-octagon",
        label: "رمز QR غير معروف",
        hint: "تأكد من رمز الطاولة.",
      };
    case "error":
      return {
        tone: "danger",
        icon: "bi-wifi-off",
        label: "تعذّر التحقق",
        hint: "تحقّق من الاتصال.",
      };
    default:
      return {
        tone: "muted",
        icon: "bi-info-circle",
        label: "لم يتم ربط الطاولة",
        hint: "امسح رمز QR في طاولتك لطلب النادل أو الحساب.",
      };
  }
}
