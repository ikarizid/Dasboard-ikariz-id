import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getInvoiceSettings, setInvoiceSettings } from "../../lib/mock-data";
import { toast } from "sonner";
import { ArrowLeft, FileText, RotateCcw } from "lucide-react";

export function InvoiceSettings() {
  const navigate = useNavigate();
  const settings = getInvoiceSettings();

  const [prefix, setPrefix] = useState(settings.prefix);
  const [resetNumber, setResetNumber] = useState(false);

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
    </div>
  );
}