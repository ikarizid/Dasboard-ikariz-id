import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getInvoiceSettings, setInvoiceSettings } from "../../lib/mock-data";
import { toast } from "sonner";
import { ArrowLeft, FileText, RotateCcw, MessageCircle, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import { sendWATest } from "../../lib/notification";

export function InvoiceSettings() {
  const navigate = useNavigate();
  const settings = getInvoiceSettings();

  const [prefix, setPrefix] = useState(settings.prefix);
  const [resetNumber, setResetNumber] = useState(false);
  const [testingWA, setTestingWA] = useState(false);

  const waPhone = import.meta.env.VITE_CALLMEBOT_PHONE || "";
  const waApiKey = import.meta.env.VITE_CALLMEBOT_APIKEY || "";
  const waConfigured =
    waPhone && waApiKey &&
    waPhone !== "628xxxxxxxxx" &&
    waApiKey !== "YOUR_API_KEY_HERE";

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const yearShort = year.slice(2);
  const nextNum = resetNumber
    ? 1
    : settings.lastMonth === `${month}-${year}`
    ? settings.lastNumber + 1
    : 1;

  const preview = `${prefix || "IK"}/${month}${yearShort}/${String(nextNum).padStart(3, "0")}`;

  const handleSave = () => {
    const updated = {
      prefix: prefix.trim() || "IK",
      lastMonth: resetNumber ? "" : settings.lastMonth,
      lastNumber: resetNumber ? 0 : settings.lastNumber,
    };
    setInvoiceSettings(updated);
    toast.success("Setting nomor invoice disimpan!");
  };

  const handleResetCounter = () => {
    setResetNumber(true);
    toast("Nomor akan direset ke 001 saat order berikutnya dibuat");
  };

  const handleTestWA = async () => {
    setTestingWA(true);
    const result = await sendWATest();
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setTestingWA(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/owner")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Setting Nomor Invoice</h1>
        <p className="text-slate-500 mt-1">Atur template dan format nomor faktur otomatis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template Nomor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Prefix */}
          <div className="space-y-2">
            <Label>Prefix / Kode Awal</Label>
            <Input
              value={prefix}
              onChange={e => setPrefix(e.target.value.toUpperCase())}
              placeholder="Contoh: IK, INV, IKARIZ"
              maxLength={10}
              className="w-48"
            />
            <p className="text-xs text-slate-400">Maksimal 10 karakter, otomatis huruf kapital</p>
          </div>

          {/* Format info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Format nomor yang digunakan:</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm font-mono">{prefix || "IK"}</span>
              <span className="text-slate-400">/</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-mono">{month}{yearShort}</span>
              <span className="text-slate-400">/</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-mono">001</span>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><span className="font-medium text-slate-600">{prefix || "IK"}</span> = prefix yang kamu set</p>
              <p><span className="font-medium text-slate-600">{month}{yearShort}</span> = bulan & tahun otomatis (ganti tiap bulan)</p>
              <p><span className="font-medium text-slate-600">001</span> = nomor urut, otomatis naik & reset tiap bulan baru</p>
            </div>
          </div>

          {/* Preview */}
          <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Preview nomor berikutnya</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{preview}</p>
          </div>

          {/* Status bulan ini */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Status bulan ini</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Bulan aktif</p>
                <p className="font-medium">{settings.lastMonth || "Belum ada order"}</p>
              </div>
              <div>
                <p className="text-slate-500">Nomor terakhir</p>
                <p className="font-medium">{settings.lastNumber > 0 ? String(settings.lastNumber).padStart(3, "0") : "-"}</p>
              </div>
            </div>
          </div>

          {/* Reset counter */}
          <div className="flex items-center justify-between border border-red-100 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Reset nomor urut</p>
              <p className="text-xs text-slate-400 mt-0.5">Nomor akan mulai dari 001 lagi pada order berikutnya</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetCounter}
              className={resetNumber ? "border-red-400 text-red-600 bg-red-50" : "border-slate-300"}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {resetNumber ? "Akan Direset ✓" : "Reset Counter"}
            </Button>
          </div>

          <Button onClick={handleSave} className="w-full bg-slate-900 hover:bg-slate-800">
            Simpan Setting
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Notifikasi WhatsApp
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Kirim reminder otomatis ke WA kamu saat ada order H-2 deadline
          </p>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Status konfigurasi */}
          <div className={`flex items-start gap-3 rounded-lg p-4 ${waConfigured ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
            {waConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-semibold ${waConfigured ? "text-green-700" : "text-amber-700"}`}>
                {waConfigured ? "Notifikasi WA Aktif" : "Belum Dikonfigurasi"}
              </p>
              <p className={`text-xs mt-0.5 ${waConfigured ? "text-green-600" : "text-amber-600"}`}>
                {waConfigured
                  ? `Reminder akan dikirim ke: ${waPhone.replace(/^(\d{3})\d+(\d{4})$/, "$1****$2")}`
                  : "Isi VITE_CALLMEBOT_PHONE dan VITE_CALLMEBOT_APIKEY di file .env.local lalu restart app."}
              </p>
            </div>
          </div>

          {/* Cara aktivasi */}
          {!waConfigured && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700">Cara Aktivasi CallMeBot (Gratis)</p>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>
                  Kirim pesan WA ke nomor{" "}
                  <a
                    href="https://wa.me/34644384190?text=I%20allow%20callmebot%20to%20send%20me%20messages"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-600 font-semibold underline"
                  >
                    +34 644 38 41 90 <ExternalLink className="w-3 h-3" />
                  </a>
                  {" dengan pesan: "}
                  <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-xs">I allow callmebot to send me messages</code>
                </li>
                <li>Tunggu balasan berisi API Key dari CallMeBot</li>
                <li>
                  Buka file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.env.local</code> di root project dan isi:
                  <pre className="mt-1 bg-slate-800 text-green-300 text-xs p-2 rounded-md overflow-x-auto">{`VITE_CALLMEBOT_PHONE=628xxxxxxxxx\nVITE_CALLMEBOT_APIKEY=xxxxxxxx`}</pre>
                </li>
                <li>Restart app dengan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">npm run dev</code></li>
              </ol>
            </div>
          )}

          {/* Info cara kerja */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">Cara Kerja Reminder</p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li>Reminder terkirim otomatis saat kamu buka dashboard Owner</li>
              <li>Hanya dikirim untuk order yang tepat H-2 sebelum deadline</li>
              <li>Setiap order hanya reminder 1x per hari (anti spam)</li>
              <li>Pesan berisi detail lengkap: klien, jenis, deadline, reseller, harga</li>
            </ul>
          </div>

          {/* Test button */}
          <Button
            onClick={handleTestWA}
            disabled={testingWA || !waConfigured}
            variant="outline"
            className="w-full border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {testingWA ? "Mengirim pesan test..." : "Test Kirim WA Sekarang"}
          </Button>
          {!waConfigured && (
            <p className="text-xs text-center text-slate-400">
              Tombol test aktif setelah konfigurasi .env.local selesai
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}