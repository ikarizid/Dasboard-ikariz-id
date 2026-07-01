import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { Order, User, generateInvoiceNumber } from "../lib/mock-data";
import { createSupabaseOrder, getSupabaseOrders, getSupabaseUsers } from "../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

// Template column definition
const TEMPLATE_COLUMNS = [
  "Nama Klien",
  "Jenis Layanan",
  "Subjek",
  "Tanggal Order",
  "Deadline",
  "Harga",
  "Prioritas",
  "Catatan",
];

const VALID_SERVICE_TYPES = ["Tugas", "Skripsi", "Makalah", "Essay", "Laporan", "Tesis", "Lainnya"];
const VALID_PRIORITIES = ["Tinggi", "Sedang", "Rendah"];

interface ParsedRow {
  clientName: string;
  serviceType: string;
  subject: string;
  orderDate: string;
  deadline: string;
  price: number | string;
  priority: string;
  notes: string;
  valid: boolean;
  errors: string[];
}

export function ImportExportExcel() {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [resellers, setResellers] = useState<User[]>([]);
  const [selectedReseller, setSelectedReseller] = useState<string>("owner");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== DOWNLOAD TEMPLATE =====
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Header row
    const wsData = [TEMPLATE_COLUMNS];

    // Add 2 example rows
    wsData.push([
      "Ahmad Fauzi",
      "Skripsi",
      "Analisis Pengaruh Media Sosial",
      new Date().toISOString().split("T")[0],
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split("T")[0];
      })(),
      5000000,
      "Tinggi",
      "Bab 1-3, format APA",
    ]);
    wsData.push([
      "Siti Lestari",
      "Tugas",
      "Makalah Ekonomi Mikro",
      new Date().toISOString().split("T")[0],
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split("T")[0];
      })(),
      500000,
      "Sedang",
      "15 halaman",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Nama Klien
      { wch: 15 }, // Jenis Layanan
      { wch: 35 }, // Subjek
      { wch: 15 }, // Tanggal Order
      { wch: 15 }, // Deadline
      { wch: 12 }, // Harga
      { wch: 10 }, // Prioritas
      { wch: 30 }, // Catatan
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template Order");

    // Add instruction sheet
    const instrData = [
      ["PETUNJUK PENGISIAN TEMPLATE ORDER IKARIZ.ID"],
      [""],
      ["Kolom", "Keterangan", "Contoh", "Wajib?"],
      ["Nama Klien", "Nama lengkap klien", "Ahmad Fauzi", "Ya"],
      ["Jenis Layanan", "Pilih: Tugas, Skripsi, Makalah, Essay, Laporan, Tesis, Lainnya", "Skripsi", "Ya"],
      ["Subjek", "Deskripsi singkat topik", "Analisis Media Sosial", "Ya"],
      ["Tanggal Order", "Format: YYYY-MM-DD", "2026-06-30", "Ya"],
      ["Deadline", "Format: YYYY-MM-DD", "2026-07-15", "Ya"],
      ["Harga", "Angka (tanpa titik/koma), dalam Rupiah", "500000", "Ya"],
      ["Prioritas", "Pilih: Tinggi, Sedang, Rendah", "Sedang", "Ya"],
      ["Catatan", "Catatan tambahan (opsional)", "Bab 1-3", "Tidak"],
      [""],
      ["⚠️ Hapus baris contoh sebelum mengisi data Anda sendiri!"],
      ["⚠️ Pastikan format tanggal benar: YYYY-MM-DD (misal: 2026-07-15)"],
    ];
    const instrWs = XLSX.utils.aoa_to_sheet(instrData);
    instrWs["!cols"] = [{ wch: 18 }, { wch: 55 }, { wch: 25 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, instrWs, "Petunjuk");

    XLSX.writeFile(wb, "Template_Order_IKARIZ_ID.xlsx");
    toast.success("Template berhasil diunduh!");
  };

  // ===== PARSE UPLOADED FILE =====
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Load resellers for selection
    try {
      const users = await getSupabaseUsers();
      setResellers(users.filter((u) => u.role === "reseller" && u.active));
    } catch {
      // If it fails, just proceed without reseller list
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        if (jsonData.length < 2) {
          toast.error("File kosong atau tidak memiliki data");
          return;
        }

        // Skip header row
        const rows = jsonData.slice(1);
        const parsed: ParsedRow[] = rows
          .filter((row: any[]) => row.some((cell: any) => cell !== undefined && cell !== ""))
          .map((row: any[]) => {
            const errors: string[] = [];

            const clientName = String(row[0] || "").trim();
            const serviceType = String(row[1] || "").trim();
            const subject = String(row[2] || "").trim();
            const orderDateRaw = row[3];
            const deadlineRaw = row[4];
            const priceRaw = row[5];
            const priority = String(row[6] || "").trim();
            const notes = String(row[7] || "").trim();

            if (!clientName) errors.push("Nama Klien kosong");
            if (!VALID_SERVICE_TYPES.includes(serviceType))
              errors.push(`Jenis Layanan "${serviceType}" tidak valid`);
            if (!subject) errors.push("Subjek kosong");
            if (!VALID_PRIORITIES.includes(priority))
              errors.push(`Prioritas "${priority}" tidak valid`);

            // Parse dates
            let orderDate = "";
            let deadline = "";

            const parseExcelDate = (val: any): string => {
              if (!val) return "";
              if (typeof val === "number") {
                // Excel serial date
                const d = XLSX.SSF.parse_date_code(val);
                return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
              }
              const str = String(val).trim();
              // Try YYYY-MM-DD
              if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
              // Try DD/MM/YYYY
              const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
              if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
              return str;
            };

            orderDate = parseExcelDate(orderDateRaw);
            deadline = parseExcelDate(deadlineRaw);

            if (!orderDate || isNaN(Date.parse(orderDate))) errors.push("Tanggal Order tidak valid");
            if (!deadline || isNaN(Date.parse(deadline))) errors.push("Deadline tidak valid");

            // Parse price
            let price: number | string = 0;
            if (priceRaw !== undefined && priceRaw !== "") {
              const numPrice = Number(String(priceRaw).replace(/[.,\s]/g, ""));
              if (isNaN(numPrice)) {
                price = String(priceRaw);
              } else {
                price = numPrice;
              }
            } else {
              errors.push("Harga kosong");
            }

            return {
              clientName,
              serviceType,
              subject,
              orderDate,
              deadline,
              price,
              priority,
              notes,
              valid: errors.length === 0,
              errors,
            };
          });

        setParsedData(parsed);
        setPreviewOpen(true);

        const validCount = parsed.filter((r) => r.valid).length;
        const invalidCount = parsed.length - validCount;
        if (invalidCount > 0) {
          toast.warning(`${validCount} data valid, ${invalidCount} data bermasalah`);
        } else {
          toast.success(`${validCount} data berhasil diparsing!`);
        }
      } catch (err) {
        toast.error("Gagal membaca file Excel");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ===== IMPORT TO SUPABASE =====
  const handleImport = async () => {
    const validRows = parsedData.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("Tidak ada data valid untuk diimport");
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      try {
        const invoiceNumber = generateInvoiceNumber();
        await createSupabaseOrder({
          clientName: row.clientName,
          serviceType: row.serviceType as any,
          subject: row.subject,
          orderDate: row.orderDate,
          deadline: row.deadline,
          price: Number(row.price) || 0,
          priority: row.priority as any,
          status: "Pending",
          notes: row.notes,
          resellerId: selectedReseller === "owner" ? undefined : selectedReseller,
          invoiceNumber,
          commissionAmount: 0,
          commissionPaid: false,
          invoiceTitle: "Faktur Pembayaran",
          invoiceNotes: "",
        });
        success++;
      } catch (err) {
        failed++;
        console.error("Import error:", err);
      }
    }

    setImporting(false);
    setPreviewOpen(false);
    setParsedData([]);

    if (failed === 0) {
      toast.success(`🎉 ${success} order berhasil diimport!`);
    } else {
      toast.warning(`${success} berhasil, ${failed} gagal diimport`);
    }
  };

  // ===== EXPORT TO EXCEL =====
  const handleExport = async () => {
    setExporting(true);
    try {
      const [orders, users] = await Promise.all([
        getSupabaseOrders(),
        getSupabaseUsers(),
      ]);

      const resellersMap = new Map(users.map((u) => [u.id, u.displayName]));

      const exportData = orders.map((o) => ({
        "No. Invoice": o.invoiceNumber,
        "Nama Klien": o.clientName,
        "Jenis Layanan": o.serviceType,
        Subjek: o.subject,
        "Tanggal Order": o.orderDate,
        Deadline: o.deadline,
        Harga: Number(o.price) || o.price,
        Prioritas: o.priority,
        Status: o.status,
        Reseller: resellersMap.get(o.resellerId) || "Owner",
        "Komisi (Rp)": o.commissionAmount,
        "Komisi Dibayar": o.commissionPaid ? "Ya" : "Tidak",
        "Status Pembayaran": o.payment_status || "Belum Lunas",
        Catatan: o.notes,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws["!cols"] = [
        { wch: 18 }, // Invoice
        { wch: 20 }, // Nama Klien
        { wch: 14 }, // Jenis Layanan
        { wch: 35 }, // Subjek
        { wch: 14 }, // Tanggal Order
        { wch: 14 }, // Deadline
        { wch: 14 }, // Harga
        { wch: 10 }, // Prioritas
        { wch: 12 }, // Status
        { wch: 18 }, // Reseller
        { wch: 14 }, // Komisi
        { wch: 14 }, // Komisi Dibayar
        { wch: 16 }, // Status Pembayaran
        { wch: 30 }, // Catatan
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Rekap Order");

      // Summary sheet
      const totalRevenue = orders
        .filter((o) => o.status !== "Cancelled")
        .reduce((sum, o) => sum + (Number(o.price) || 0), 0);
      const totalDone = orders.filter((o) => o.status === "Done").length;
      const totalPending = orders.filter((o) => o.status === "Pending").length;
      const totalInProgress = orders.filter((o) => o.status === "In Progress").length;

      const summaryData = [
        ["RINGKASAN REKAP ORDER - IKARIZ.ID"],
        [`Tanggal Export: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`],
        [""],
        ["Metrik", "Nilai"],
        ["Total Order", orders.length],
        ["Order Selesai (Done)", totalDone],
        ["Order Berjalan (In Progress)", totalInProgress],
        ["Order Pending", totalPending],
        ["Order Dibatalkan", orders.filter((o) => o.status === "Cancelled").length],
        ["Total Revenue", totalRevenue],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs["!cols"] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Rekap_Order_IKARIZ_ID_${dateStr}.xlsx`);
      toast.success("Data berhasil diekspor ke Excel!");
    } catch (err) {
      toast.error("Gagal mengekspor data");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const validCount = parsedData.filter((r) => r.valid).length;
  const invalidCount = parsedData.length - validCount;

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* === Section 1: Download Template === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  Download Template Excel
                </CardTitle>
                <p className="text-white/50 text-sm mt-0.5">
                  Unduh template kosong, isi data order, lalu upload kembali
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                onClick={handleDownloadTemplate}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Template
              </Button>
              <div className="text-xs text-white/40 space-y-1">
                <p>📄 Format: .xlsx (Excel)</p>
                <p>📝 Berisi kolom: Nama Klien, Jenis Layanan, Subjek, Tanggal, Deadline, Harga, Prioritas, Catatan</p>
                <p>📖 Termasuk sheet petunjuk pengisian</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* === Section 2: Import Excel === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  Import Data dari Excel
                </CardTitle>
                <p className="text-white/50 text-sm mt-0.5">
                  Upload file Excel yang sudah diisi untuk menambah order secara massal
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center
                  hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-white/30 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                  Klik untuk memilih file Excel atau drag & drop
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Format yang didukung: .xlsx, .xls
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* === Section 3: Export Data === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  Export Data ke Excel
                </CardTitle>
                <p className="text-white/50 text-sm mt-0.5">
                  Unduh semua data order yang sudah terekap ke file Excel
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? "Mengekspor..." : "Export Semua Data"}
              </Button>
              <div className="text-xs text-white/40 space-y-1">
                <p>📊 Berisi semua order dari database</p>
                <p>📋 Termasuk sheet ringkasan (summary)</p>
                <p>💰 Data harga, komisi, status pembayaran lengkap</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* === Preview & Import Dialog === */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview Data Import
            </DialogTitle>
            <DialogDescription>
              File: <strong>{fileName}</strong> — {parsedData.length} baris data ditemukan
            </DialogDescription>
          </DialogHeader>

          {/* Stats badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-emerald-100 text-emerald-800 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {validCount} Valid
            </Badge>
            {invalidCount > 0 && (
              <Badge className="bg-red-100 text-red-800 gap-1">
                <AlertCircle className="w-3 h-3" />
                {invalidCount} Bermasalah
              </Badge>
            )}
          </div>

          {/* Reseller Selection */}
          <div className="space-y-2 py-2 border-y border-slate-200">
            <Label className="text-sm font-medium">Assign Reseller (Opsional)</Label>
            <Select value={selectedReseller} onValueChange={setSelectedReseller}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Pilih reseller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">— Tanpa Reseller (Owner)</SelectItem>
                {resellers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Semua order yang diimport akan di-assign ke reseller yang dipilih</p>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nama Klien</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Subjek</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Prioritas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className={!row.valid ? "bg-red-50/50" : ""}
                  >
                    <TableCell className="text-xs text-slate-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      {row.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="flex items-center gap-1" title={row.errors.join(", ")}>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-[10px] text-red-500 max-w-[120px] truncate">
                            {row.errors[0]}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {row.clientName || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.serviceType || "—"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {row.subject || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {row.orderDate || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {row.deadline || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatCurrency(row.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          row.priority === "Tinggi"
                            ? "bg-red-100 text-red-800"
                            : row.priority === "Sedang"
                            ? "bg-yellow-100 text-yellow-800"
                            : row.priority === "Rendah"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {row.priority || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewOpen(false);
                setParsedData([]);
              }}
              disabled={importing}
            >
              <X className="w-4 h-4 mr-1" />
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {importing
                ? "Mengimport..."
                : `Import ${validCount} Order Valid`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
