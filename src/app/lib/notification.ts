import { Order } from "./mock-data";

// Kunci localStorage untuk mencatat kapan reminder sudah dikirim (anti-duplikat)
const REMINDER_SENT_KEY = "wa_reminders_sent";

/**
 * Hitung selisih hari antara sekarang dan deadline.
 * Positif = masih belum lewat, negatif = sudah lewat
 */
export function getDaysUntilDeadline(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diff = dl.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Ambil semua order yang belum Done/Cancelled, urutkan dari deadline paling mepet
 */
export function getPendingOrdersSorted(orders: Order[]): Order[] {
  return orders
    .filter((o) => o.status !== "Done" && o.status !== "Cancelled")
    .sort((a, b) => {
      const dA = getDaysUntilDeadline(a.deadline);
      const dB = getDaysUntilDeadline(b.deadline);
      return dA - dB;
    });
}

/**
 * Format label countdown untuk ditampilkan di UI
 */
export function getCountdownLabel(days: number): {
  label: string;
  color: "red" | "orange" | "yellow" | "green";
  urgent: boolean;
} {
  if (days < 0) {
    return { label: `Terlambat ${Math.abs(days)} hari!`, color: "red", urgent: true };
  } else if (days === 0) {
    return { label: "Hari ini!", color: "red", urgent: true };
  } else if (days === 1) {
    return { label: "Besok!", color: "orange", urgent: true };
  } else if (days <= 2) {
    return { label: `H-${days}`, color: "orange", urgent: true };
  } else if (days <= 7) {
    return { label: `H-${days}`, color: "yellow", urgent: false };
  } else {
    return { label: `H-${days}`, color: "green", urgent: false };
  }
}

/**
 * Format pesan WhatsApp untuk dikirim via CallMeBot
 */
function formatWAMessage(order: Order, resellerName: string): string {
  const deadlineDate = new Date(order.deadline).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const priceFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(order.price));

  return (
    `⚠️ *REMINDER H-2 DEADLINE*\n\n` +
    `📋 *${order.invoiceNumber}*\n` +
    `👤 Klien: ${order.clientName}\n` +
    `📚 Jenis: ${order.serviceType}\n` +
    `📝 Subjek: ${order.subject}\n` +
    `👥 Reseller: ${resellerName}\n` +
    `💰 Harga: ${priceFormatted}\n` +
    `⚡ Prioritas: ${order.priority}\n` +
    `📊 Status: ${order.status}\n` +
    `⏰ Deadline: ${deadlineDate}\n\n` +
    `_Segera selesaikan tugas ini!_ 🎯`
  );
}

/**
 * Kirim pesan WhatsApp via CallMeBot API
 */
export async function sendWAReminder(
  order: Order,
  resellerName: string
): Promise<boolean> {
  const phone = import.meta.env.VITE_CALLMEBOT_PHONE;
  const apiKey = import.meta.env.VITE_CALLMEBOT_APIKEY;

  if (
    !phone ||
    !apiKey ||
    phone === "628xxxxxxxxx" ||
    apiKey === "YOUR_API_KEY_HERE"
  ) {
    console.warn("[WA Reminder] CallMeBot belum dikonfigurasi di .env.local");
    return false;
  }

  const message = formatWAMessage(order, resellerName);
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  try {
    // Fetch langsung ke CallMeBot (no-cors karena CORS restriction)
    await fetch(url, { method: "GET", mode: "no-cors" });
    console.log(`[WA Reminder] Reminder terkirim untuk order ${order.invoiceNumber}`);
    return true;
  } catch (e) {
    console.error("[WA Reminder] Gagal kirim WA:", e);
    return false;
  }
}

/**
 * Ambil daftar order ID yang sudah dapat reminder hari ini
 */
function getSentReminders(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REMINDER_SENT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Tandai order sudah dapat reminder hari ini
 */
function markReminderSent(orderId: string) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sent = getSentReminders();
  sent[orderId] = today;
  localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(sent));
}

/**
 * Cek apakah order sudah dapat reminder hari ini
 */
function wasReminderSentToday(orderId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const sent = getSentReminders();
  return sent[orderId] === today;
}

/**
 * Main function: cek semua order, kirim WA jika H-2 dan belum terkirim hari ini
 */
export async function checkAndSendReminders(
  orders: Order[],
  getUserName: (resellerId: string) => string
): Promise<void> {
  const phone = import.meta.env.VITE_CALLMEBOT_PHONE;
  const apiKey = import.meta.env.VITE_CALLMEBOT_APIKEY;

  if (
    !phone ||
    !apiKey ||
    phone === "628xxxxxxxxx" ||
    apiKey === "YOUR_API_KEY_HERE"
  ) {
    return;
  }

  const pending = getPendingOrdersSorted(orders);

  for (const order of pending) {
    const days = getDaysUntilDeadline(order.deadline);

    // Hanya kirim untuk H-2 (persis)
    if (days === 2 && !wasReminderSentToday(order.id)) {
      const resellerName = getUserName(order.resellerId);
      const ok = await sendWAReminder(order, resellerName);
      if (ok) {
        markReminderSent(order.id);
      }
      // Delay kecil antar request agar tidak spam
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

/**
 * Kirim WA test untuk verifikasi koneksi CallMeBot
 */
export async function sendWATest(): Promise<{ ok: boolean; message: string }> {
  const phone = import.meta.env.VITE_CALLMEBOT_PHONE;
  const apiKey = import.meta.env.VITE_CALLMEBOT_APIKEY;

  if (
    !phone ||
    !apiKey ||
    phone === "628xxxxxxxxx" ||
    apiKey === "YOUR_API_KEY_HERE"
  ) {
    return {
      ok: false,
      message:
        "Nomor WA atau API Key belum diisi di .env.local. Isi dulu lalu restart app.",
    };
  }

  const testMsg = encodeURIComponent(
    `✅ *Test Koneksi Berhasil!*\n\nIkariz ID Dashboard berhasil terhubung ke WhatsApp kamu.\nReminder H-2 deadline akan otomatis dikirim ke nomor ini. 🎉`
  );
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${testMsg}&apikey=${apiKey}`;

  try {
    await fetch(url, { method: "GET", mode: "no-cors" });
    return {
      ok: true,
      message:
        "Pesan test dikirim! Cek WhatsApp kamu dalam beberapa detik. (mode no-cors, pesan sudah dikirim jika tidak ada error)",
    };
  } catch (e) {
    return { ok: false, message: `Gagal mengirim: ${e}` };
  }
}
