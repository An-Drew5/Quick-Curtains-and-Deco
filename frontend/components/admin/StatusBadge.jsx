const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  in_stock: "bg-emerald-100 text-emerald-700",
  out_of_stock: "bg-red-100 text-red-700",
  made_to_order: "bg-violet-100 text-violet-700",
};

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();
  const className =
    STATUS_STYLES[normalizedStatus] || "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {normalizedStatus || "unknown"}
    </span>
  );
}
