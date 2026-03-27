import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { getCurrentUser, Order, User } from "../lib/mock-data";
import { getSupabaseOrders, getSupabaseUsers, updateSupabaseOrder } from "../lib/api";
import { ArrowLeft, Printer, Download, Edit2, Check, X, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function Invoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingInvoiceNo, setEditingInvoiceNo] = useState(false);
  const [titleValue, setTitleValue] = useState("Faktur Pembayaran");
  const [notesValue, setNotesValue] = useState("");
  const [invoiceNoValue, setInvoiceNoValue] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Lunas" | "Belum Lunas">("Belum Lunas");

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const [o, u] = await Promise.all([getSupabaseOrders(), getSupabaseUsers()]);
        setAllOrders(o);
        setUsers(u);

        const currentOrder = o.find(orc => orc.id === orderId);
        if (currentOrder) {
          setTitleValue(currentOrder.invoiceTitle || "Faktur Pembayaran");
          setNotesValue(currentOrder.invoiceNotes || "");
          setInvoiceNoValue(currentOrder.invoiceNumber || "");
          setPaymentStatus((currentOrder.payment_status as "Lunas" | "Belum Lunas") || "Belum Lunas");
        }
      } catch (e) {
        toast.error("Gagal mengambil data faktur");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceData();
  }, [orderId]);

  const order = allOrders.find(o => o.id === orderId);
  const reseller = order?.resellerId ? users.find(u => u.id === order.resellerId) : null;

  const handleBack = () => {
    if (currentUser?.role === "owner") navigate("/owner/orders");
    else navigate("/reseller/orders");
  };

  const saveField = async (field: "invoiceTitle" | "invoiceNotes" | "invoiceNumber", value: string) => {
    if (!order) return;
    try {
      await updateSupabaseOrder(order.id, { [field]: value });
      const updated = allOrders.map(o => o.id === order.id ? { ...o, [field]: value } : o);
      setAllOrders(updated);
      toast.success("Tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan ke database");
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const buildInvoiceHTML = (mode: "print" | "png" = "print") => {
    if (!order) return "";
    const commission = order.commissionAmount || 0;
    const priceNum = Number(order.price) || 0;
    const netIncome = priceNum - commission;
    const isOwner = currentUser?.role === "owner";

    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: white;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .page {
    max-width: 750px;
    margin: 0 auto;
    background: white;
    position: relative;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .header-wrap { position: relative; }

  .header-bg {
    background: #5B0FAB !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    padding: 30px 44px 70px 44px;
    border-radius: 0 0 0 60px;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .header-left {}

  .header-title {
    color: white !important;
    font-size: 50px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -2px;
  }

  .header-sub {
    color: #c4b5fd !important;
    font-size: 14px;
    margin-top: 6px;
  }

  .logo-box {
    width: 90px;
    height: 80px;
    background: #7c3aed !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .logo-ik {
    color: white !important;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1;
  }

  .logo-sub {
    color: #c4b5fd !important;
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .lime-wrap {
    position: relative;
    margin-top: -40px;
    padding: 0 28px;
    z-index: 10;
  }

  .lime-card {
    background: #CCFF00 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    border-radius: 16px 16px 0 0;
    padding: 16px 24px 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .invoice-to-label {
    font-size: 11px;
    font-weight: 700;
    color: #3d3d3d;
    letter-spacing: 0.3px;
  }

  .client-name {
    font-size: 20px;
    font-weight: 900;
    color: #1a1a1a;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: -0.5px;
  }

  .lime-right { text-align: right; }

  .inv-no-label {
    font-size: 10px;
    font-weight: 700;
    color: #3d3d3d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .inv-no-value {
    font-size: 14px;
    font-weight: 800;
    color: #1a1a1a;
    margin-top: 2px;
  }

  .date-label {
    font-size: 10px;
    font-weight: 700;
    color: #3d3d3d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 8px;
  }

  .date-value {
    font-size: 11px;
    color: #333;
    margin-top: 2px;
  }

  .lime-footer {
    background: #CCFF00 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0;
    border-radius: 0 0 16px 16px;
    padding: 8px 24px 10px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #3d3d3d;
    font-weight: 600;
    border-top: 1px solid rgba(0,0,0,0.08);
  }

  .body { padding: 20px 44px; }

  .status-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }

  .badge {
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .badge-lunas {
    background: #d1fae5 !important;
    color: #065f46 !important;
  }

  .badge-belum {
    background: #fee2e2 !important;
    color: #991b1b !important;
  }

  .summary-strip {
    background: #f5f3ff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .summary-strip .svc {
    font-size: 13px;
    color: #5B0FAB !important;
    font-weight: 700;
  }

  .summary-strip .price-big {
    font-size: 20px;
    font-weight: 800;
    color: #5B0FAB !important;
  }

  .section { margin-bottom: 16px; }

  .section-title {
    font-size: 10px;
    font-weight: 800;
    color: #5B0FAB !important;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 2px solid #f3e8ff;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .detail-item label {
    font-size: 10px;
    color: #9ca3af;
    display: block;
    margin-bottom: 2px;
  }

  .detail-item span {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .detail-item.full { grid-column: 1 / -1; }

  .p-tinggi { color: #dc2626 !important; }
  .p-sedang { color: #d97706 !important; }
  .p-rendah { color: #16a34a !important; }

  hr {
    border: none;
    border-top: 1px solid #f3e8ff;
    margin: 14px 0;
  }

  .price-table { width: 100%; border-collapse: collapse; }
  .price-table td { padding: 6px 0; font-size: 13px; }
  .price-table .label { color: #6b7280; }
  .price-table .value { text-align: right; font-weight: 600; color: #1a1a1a; }
  .price-table .total-row td {
    border-top: 2px solid #5B0FAB;
    padding-top: 10px;
    font-weight: 800;
  }
  .price-table .total-row .value {
    color: #5B0FAB !important;
    font-size: 18px;
  }
  .red { color: #dc2626 !important; }
  .green { color: #16a34a !important; }

  .notes-box {
    background: #fafaf9 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #5B0FAB;
    border-radius: 0 6px 6px 0;
    padding: 10px 14px;
    min-height: 40px;
    font-size: 12px;
    color: #374151;
    line-height: 1.6;
  }

  .page-footer {
    background: #5B0FAB !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin-top: 24px;
    padding: 20px 44px;
    text-align: center;
    border-radius: 0 40px 0 0;
  }

  .footer-brand {
    color: #CCFF00 !important;
    font-weight: 800;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .page-footer p {
    color: #e9d5ff !important;
    font-size: 11px;
    line-height: 1.8;
  }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body { background: white; margin: 0; }
    .page { box-shadow: none; max-width: 100%; }
    @page { margin: 0; size: A4; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header-wrap">
    <div class="header-bg">
      <div class="header-top">
        <div class="header-left">
          <div class="header-title">Invoice</div>
          <div class="header-sub">Teman Tugas Ikariz.id</div>
        </div>
        <div class="logo-box">
          <div class="logo-ik">IK</div>
          <div class="logo-sub">Ikariz ID</div>
        </div>
      </div>
    </div>

    <div class="lime-wrap">
      <div class="lime-card">
        <div>
          <div class="invoice-to-label">Invoice To</div>
          <div class="client-name">${order.clientName}</div>
        </div>
        <div class="lime-right">
          <div class="inv-no-label">No Invoice</div>
          <div class="inv-no-value">${invoiceNoValue}</div>
          <div class="date-label">Tanggal</div>
          <div class="date-value">${formatDate(order.orderDate)} s/d ${formatDate(order.deadline)}</div>
        </div>
      </div>
      <div class="lime-footer">
        <span>ig: teman tugas ikariz.id</span>
        <span>web: https://teman-tugas-ikariz-id.vercel.app/</span>
      </div>
    </div>
  </div>

  <div class="body">

    <div class="status-row">
      <span class="badge ${paymentStatus === "Lunas" ? "badge-lunas" : "badge-belum"}">${paymentStatus}</span>
    </div>

    <div class="summary-strip">
      <span class="svc">Total Harga Tagihan</span>
      <span class="price-big">${formatCurrency(order.price)}</span>
    </div>

    <div class="section">
      <div class="section-title">Detail Layanan</div>
      <div class="detail-grid">
        <div class="detail-item">
          <label>Jenis Layanan</label>
          <span>${order.serviceType}</span>
        </div>
        <div class="detail-item">
          <label>Prioritas</label>
          <span class="${order.priority === "Tinggi" ? "p-tinggi" : order.priority === "Sedang" ? "p-sedang" : "p-rendah"}">${order.priority}</span>
        </div>
        <div class="detail-item full">
          <label>Subjek / Topik</label>
          <span>${order.subject}</span>
        </div>
        <div class="detail-item">
          <label>Tanggal Order</label>
          <span>${formatDate(order.orderDate)}</span>
        </div>
        <div class="detail-item">
          <label>Deadline</label>
          <span>${formatDate(order.deadline)}</span>
        </div>
        ${order.notes ? `
        <div class="detail-item full">
          <label>Catatan Order</label>
          <span>${order.notes}</span>
        </div>` : ""}
      </div>
    </div>

    <hr/>

    <div class="section">
      <div class="section-title">Rincian Pembayaran</div>
      <table class="price-table">
        <tr>
          <td class="label">Harga Layanan</td>
          <td class="value">${formatCurrency(order.price)}</td>
        </tr>
        ${isOwner && commission > 0 ? `
        <tr>
          <td class="label">Komisi Reseller</td>
          <td class="value red">- ${formatCurrency(commission)}</td>
        </tr>
        <tr class="total-row">
          <td class="label">Pendapatan Bersih</td>
          <td class="value">${formatCurrency(netIncome)}</td>
        </tr>` : ""}
        ${!isOwner && commission > 0 ? `
        <tr class="total-row">
          <td class="label">Komisi Anda</td>
          <td class="value green">${formatCurrency(commission)}</td>
        </tr>` : ""}
      </table>
    </div>

    <hr/>

    <div class="section">
      <div class="section-title">Catatan / Keterangan</div>
      <div class="notes-box">${notesValue || "<em style='color:#9ca3af'>—</em>"}</div>
    </div>

    ${reseller ? `
    <div class="section">
      <div class="section-title">Informasi Reseller</div>
      <div class="detail-grid">
        <div class="detail-item">
          <label>Nama Reseller</label>
          <span>${reseller.displayName}</span>
        </div>
        <div class="detail-item">
          <label>Komisi</label>
          <span>${formatCurrency(commission)}</span>
        </div>
      </div>
    </div>` : ""}

  </div>

  <div class="page-footer">
    <div class="footer-brand">Ikariz ID — Teman Tugas Terpercaya</div>
    <p>ig: teman tugas ikariz.id &nbsp;|&nbsp; web: https://teman-tugas-ikariz-id.vercel.app/</p>
    <p>Terima kasih telah mempercayakan tugas Anda kepada kami 🎓</p>
  </div>

</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script>
  window.onload = function() {
    if ('${mode}' === 'png') {
      setTimeout(() => {
        html2canvas(document.querySelector('.page'), { scale: 2, useCORS: true }).then(canvas => {
          const link = document.createElement('a');
          link.download = document.title + '.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      }, 500);
    } else {
      setTimeout(() => window.print(), 600);
    }
  }
</script>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = buildInvoiceHTML();
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 600);
  };

  const handleDownload = () => {
    if (!order) return;
    const invoiceNo = invoiceNoValue.replace(/\//g, "-");
    const clientName = order.clientName.replace(/\s+/g, "_");
    const serviceType = order.serviceType.replace(/\s+/g, "_");
    const fileName = `${clientName}-${serviceType}-${invoiceNo}`;
    const html = buildInvoiceHTML();
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.document.title = fileName;
    w.focus();
    setTimeout(() => { w.print(); }, 600);
  };

  const handleDownloadPNG = () => {
    if (!order) return;
    const invoiceNo = invoiceNoValue.replace(/\//g, "-");
    const clientName = order.clientName.replace(/\s+/g, "_");
    const serviceType = order.serviceType.replace(/\s+/g, "_");
    const fileName = `${clientName}-${serviceType}-${invoiceNo}`;
    const html = buildInvoiceHTML("png");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.document.title = fileName;
    w.focus();
  };

  if (loading) {
     return <div className="p-8 flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  if (!order) {
    return (
      <div className="p-8">
        <p>Order tidak ditemukan</p>
        <Button onClick={handleBack} className="mt-4">Kembali</Button>
      </div>
    );
  }

  const commission = order.commissionAmount || 0;
  const priceNum = Number(order.price) || 0;
  const netIncome = priceNum - commission;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex gap-2 flex-wrap">
          {currentUser?.role === "owner" && (
            <Button variant="outline" size="sm" onClick={() => navigate("/owner/invoice-settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Setting Nomor
            </Button>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              const newStatus = paymentStatus === "Lunas" ? "Belum Lunas" : "Lunas";
              setPaymentStatus(newStatus);
              if (order) {
                await saveField("payment_status" as any, newStatus);
              }
            }}
            className={paymentStatus === "Lunas" ? "border-green-500 text-green-700" : "border-red-400 text-red-600"}
          >
            Status: {paymentStatus}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Button variant="outline" onClick={handleDownloadPNG}>
            <Download className="w-4 h-4 mr-2 text-green-600" />
            Simpan PNG
          </Button>
        </div>
      </div>

      {/* Preview web */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input value={titleValue} onChange={e => setTitleValue(e.target.value)} className="h-8 w-56 text-xl font-bold" />
                    <button onClick={() => { saveField("invoiceTitle", titleValue); setEditingTitle(false); }} className="text-green-600"><Check className="w-4 h-4" /></button>
                    <button onClick={() => { setTitleValue(order.invoiceTitle || "Faktur Pembayaran"); setEditingTitle(false); }} className="text-slate-400"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-[#5B0FAB]">{titleValue}</h1>
                    <button onClick={() => setEditingTitle(true)} className="text-slate-300 hover:text-[#5B0FAB]"><Edit2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingInvoiceNo ? (
                  <div className="flex items-center gap-2">
                    <Input value={invoiceNoValue} onChange={e => setInvoiceNoValue(e.target.value)} className="h-7 text-sm w-48" />
                    <button onClick={() => { saveField("invoiceNumber", invoiceNoValue); setEditingInvoiceNo(false); }} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setInvoiceNoValue(order.invoiceNumber); setEditingInvoiceNo(false); }} className="text-slate-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-slate-500 text-sm">No. {invoiceNoValue}</p>
                    <button onClick={() => setEditingInvoiceNo(true)} className="text-slate-300 hover:text-[#5B0FAB]"><Edit2 className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <div className="w-12 h-12 bg-[#5B0FAB] rounded-xl flex flex-col items-center justify-center gap-0.5">
                  <span className="text-white font-black text-sm leading-none">IK</span>
                  <span className="text-purple-300 text-[8px] leading-none tracking-wider">IKARIZ</span>
                </div>
                <div>
                  <p className="font-bold text-[#5B0FAB] text-lg leading-none">IKARIZ ID</p>
                  <p className="text-xs text-slate-500">Group Rekap</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">Joki Tugas & Skripsi Terpercaya</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#f5f3ff] border-l-4 border-[#5B0FAB] rounded-lg px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">Tanggal Invoice</p>
              <p className="font-semibold text-sm">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Deadline</p>
              <p className="font-semibold text-sm">{formatDate(order.deadline)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStatus === "Lunas" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
              {paymentStatus}
            </span>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-[#5B0FAB] uppercase tracking-wider mb-2">Dari</p>
              <p className="font-bold">Ikariz ID</p>
              <p className="text-sm text-slate-500">Layanan Akademik Profesional</p>
              {reseller
                ? <p className="text-sm text-slate-500">Reseller: {reseller.displayName}</p>
                : <p className="text-sm text-slate-500">Direct (Owner)</p>}
            </div>
            <div>
              <p className="text-xs font-bold text-[#5B0FAB] uppercase tracking-wider mb-2">Untuk</p>
              <p className="font-bold text-lg">{order.clientName}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-bold text-[#5B0FAB] uppercase tracking-wider mb-3">Detail Layanan</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">Jenis Layanan</p>
                <p className="font-semibold">{order.serviceType}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Prioritas</p>
                <p className={`font-semibold ${order.priority === "Tinggi" ? "text-red-600" : order.priority === "Sedang" ? "text-amber-600" : "text-green-600"}`}>
                  {order.priority}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 text-xs mb-1">Subjek/Topik</p>
                <p className="font-semibold">{order.subject}</p>
              </div>
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs mb-1">Catatan Order</p>
                  <p className="font-semibold">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="bg-[#f5f3ff] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Harga Layanan</span>
              <span className="font-semibold">{formatCurrency(order.price)}</span>
            </div>
            {currentUser?.role === "owner" && commission > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Komisi Reseller</span>
                  <span className="text-red-500">- {formatCurrency(commission)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="font-bold">Pendapatan Bersih</span>
                  <span className="font-bold text-lg text-[#5B0FAB]">{formatCurrency(netIncome)}</span>
                </div>
              </>
            )}
            {currentUser?.role === "reseller" && commission > 0 && (
              <>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="font-bold">Komisi Anda</span>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(commission)}</span>
                </div>
              </>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-bold text-[#5B0FAB] uppercase tracking-wider">Catatan / Keterangan</p>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)} className="text-slate-300 hover:text-[#5B0FAB]">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  placeholder="Tambahkan catatan untuk klien..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#5B0FAB] hover:bg-[#4a0d8f]"
                    onClick={() => { saveField("invoiceNotes", notesValue); setEditingNotes(false); }}>
                    Simpan
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => { setNotesValue(order.invoiceNotes || ""); setEditingNotes(false); }}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 min-h-[50px] border-l-4 border-[#5B0FAB]">
                {notesValue || <span className="italic text-slate-300">Klik ikon edit untuk menambahkan catatan.</span>}
              </p>
            )}
          </div>

          <Separator />

          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-[#5B0FAB]">
              Terima kasih telah mempercayakan tugas Anda kepada Ikariz ID
            </p>
            <p className="text-xs text-slate-400">Invoice dibuat secara otomatis • Ikariz ID Group Rekap</p>
          </div>

        </div>
      </div>
    </div>
  );
}