import { useMemo } from "react";
import { Order } from "../lib/mock-data";
import { motion } from "motion/react";
import {
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Trophy,
  Sparkles,
} from "lucide-react";

interface TaskCompletionBannerProps {
  orders: Order[];
}

interface PeriodData {
  label: string;
  icon: React.ElementType;
  done: number;
  total: number;
  gradient: string;
  glowColor: string;
  iconBg: string;
}

export function TaskCompletionBanner({ orders }: TaskCompletionBannerProps) {
  const periods = useMemo<PeriodData[]>(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // — HARIAN: deadline = hari ini
    const todayOrders = orders.filter((o) => {
      const deadlineStr = new Date(o.deadline).toISOString().split("T")[0];
      return deadlineStr === todayStr && o.status !== "Cancelled";
    });
    const todayDone = todayOrders.filter((o) => o.status === "Done").length;

    // — MINGGUAN: deadline dalam 7 hari terakhir (termasuk hari ini)
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const weekOrders = orders.filter((o) => {
      const d = new Date(o.deadline);
      return d >= weekAgo && d <= endOfToday && o.status !== "Cancelled";
    });
    const weekDone = weekOrders.filter((o) => o.status === "Done").length;

    // — BULANAN: deadline di bulan & tahun ini
    const monthOrders = orders.filter((o) => {
      const d = new Date(o.deadline);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        o.status !== "Cancelled"
      );
    });
    const monthDone = monthOrders.filter((o) => o.status === "Done").length;

    return [
      {
        label: "Harian",
        icon: CalendarCheck,
        done: todayDone,
        total: todayOrders.length,
        gradient: "from-emerald-500/20 via-emerald-600/10 to-teal-500/20",
        glowColor: "shadow-emerald-500/10",
        iconBg: "bg-emerald-500/20",
      },
      {
        label: "Mingguan",
        icon: CalendarDays,
        done: weekDone,
        total: weekOrders.length,
        gradient: "from-blue-500/20 via-indigo-500/10 to-cyan-500/20",
        glowColor: "shadow-blue-500/10",
        iconBg: "bg-blue-500/20",
      },
      {
        label: "Bulanan",
        icon: CalendarRange,
        done: monthDone,
        total: monthOrders.length,
        gradient: "from-violet-500/20 via-purple-500/10 to-fuchsia-500/20",
        glowColor: "shadow-violet-500/10",
        iconBg: "bg-violet-500/20",
      },
    ];
  }, [orders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {periods.map((period, i) => {
        const Icon = period.icon;
        const percent =
          period.total > 0
            ? Math.round((period.done / period.total) * 100)
            : 0;
        const isComplete = period.total > 0 && period.done === period.total;

        return (
          <motion.div
            key={period.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className={`
              relative overflow-hidden rounded-2xl border border-white/10
              bg-gradient-to-br ${period.gradient}
              backdrop-blur-sm p-5 ${period.glowColor} shadow-lg
              hover:border-white/20 transition-all duration-300
              hover:shadow-xl group
            `}
          >
            {/* Glow effect */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-all duration-500" />

            {/* Header row */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${period.iconBg} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                    Tugas Selesai
                  </p>
                  <p className="text-white font-semibold text-sm">
                    {period.label}
                  </p>
                </div>
              </div>

              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: i * 0.1 + 0.3,
                  }}
                >
                  <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    COMPLETE!
                  </div>
                </motion.div>
              )}
            </div>

            {/* Numbers */}
            <div className="flex items-end gap-2 mb-3 relative z-10">
              <span className="text-3xl font-bold text-white tabular-nums">
                {period.done}
              </span>
              <span className="text-white/40 text-sm mb-1">
                / {period.total} tugas
              </span>
              {isComplete && (
                <Trophy className="w-5 h-5 text-amber-400 ml-auto mb-1 animate-bounce" />
              )}
            </div>

            {/* Progress bar */}
            <div className="relative z-10">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{
                    delay: i * 0.1 + 0.2,
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                  className={`h-full rounded-full ${
                    isComplete
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-300"
                      : percent > 50
                      ? "bg-gradient-to-r from-blue-400 to-cyan-300"
                      : "bg-gradient-to-r from-amber-400 to-orange-300"
                  }`}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/30">Progress</span>
                <span className="text-[10px] text-white/50 font-medium">
                  {percent}%
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
