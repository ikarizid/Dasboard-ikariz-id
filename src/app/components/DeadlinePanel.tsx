import { Order, User } from "../lib/mock-data";
import {
  getPendingOrdersSorted,
  getDaysUntilDeadline,
  getCountdownLabel,
} from "../lib/notification";
import { AlertTriangle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router";

interface DeadlinePanelProps {
  orders: Order[];
  users?: User[]; // untuk Owner: tampilkan nama reseller
  basePath: "owner" | "reseller"; // untuk link ke invoice
  currentUserId?: string; // untuk Reseller: filter hanya order milik dia
}

export function DeadlinePanel({
  orders,
  users = [],
  basePath,
  currentUserId,
}: DeadlinePanelProps) {
  // Filter per reseller jika ada currentUserId
  const filtered =
    currentUserId
      ? orders.filter((o) => o.resellerId === currentUserId)
      : orders;

  const pending = getPendingOrdersSorted(filtered);

  const getResellerName = (resellerId: string) => {
    const u = users.find((u) => u.id === resellerId);
    return u?.displayName || "-";
  };

  const urgentCount = pending.filter((o) => getDaysUntilDeadline(o.deadline) <= 2).length;

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-white/90 text-sm">Semua order sudah selesai! 🎉</p>
          <p className="text-white/50 text-xs mt-0.5">Tidak ada tugas yang menunggu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${urgentCount > 0 ? "bg-red-500/20" : "bg-amber-500/20"}`}>
            <AlertTriangle className={`w-4 h-4 ${urgentCount > 0 ? "text-red-400" : "text-amber-400"}`} />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Tugas Belum Selesai</h2>
            <p className="text-white/40 text-xs">{pending.length} order aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 bg-red-500/20 text-red-300 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
              {urgentCount} kritis
            </span>
          )}
          <span className="bg-white/10 text-white/60 text-xs px-2.5 py-1 rounded-full">
            {pending.length} total
          </span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto custom-scrollbar">
        {pending.map((order) => {
          const days = getDaysUntilDeadline(order.deadline);
          const countdown = getCountdownLabel(days);

          const countdownClasses = {
            red: "bg-red-500/15 text-red-300 border-red-500/30",
            orange: "bg-orange-500/15 text-orange-300 border-orange-500/30",
            yellow: "bg-amber-500/15 text-amber-300 border-amber-500/30",
            green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          }[countdown.color];

          const statusClasses: Record<string, string> = {
            "Pending": "bg-slate-500/20 text-slate-300",
            "In Progress": "bg-violet-500/20 text-violet-300",
          };

          const deadlineStr = new Date(order.deadline).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <Link
              key={order.id}
              to={`/${basePath}/invoice/${order.id}`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-white/5 transition-colors group"
            >
              {/* Countdown Badge */}
              <div className="flex-shrink-0 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${countdownClasses} ${
                    countdown.urgent ? "animate-pulse" : ""
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {countdown.label}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white/90 font-medium text-sm truncate">{order.clientName}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusClasses[order.status] || "bg-white/10 text-white/50"}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-white/50 text-xs truncate">{order.serviceType} — {order.subject}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/30 text-[11px]">📅 {deadlineStr}</span>
                  {basePath === "owner" && users.length > 0 && (
                    <span className="text-white/30 text-[11px]">👤 {getResellerName(order.resellerId)}</span>
                  )}
                  <span className="text-white/30 text-[11px] font-mono">{order.invoiceNumber}</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
