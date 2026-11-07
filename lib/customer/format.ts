const INR_WHOLE = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const INR_PAISE = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,998 for whole rupees, ₹1,398.60 when there are paise. */
export const money = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isInteger(n) ? INR_WHOLE.format(n) : INR_PAISE.format(n);
};

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** "PENDING_ADVANCE" -> "Pending advance" */
export const statusLabel = (status: string) => status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
