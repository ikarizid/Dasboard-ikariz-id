import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getCurrentUser, generateInvoiceNumber, User } from "../lib/mock-data";
import { createSupabaseOrder, uploadFileToSupabase, getSupabaseUsers } from "../lib/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";

export function NewOrder() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [resellers, setResellers] = useState<User[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    clientName: "",
    serviceType: "Tugas",
    subject: "",
    orderDate: new Date().toISOString().split("T")[0],
    deadline: "",
    price: "",
    commissionAmount: "",
    priority: "Sedang",
    notes: "",
    resellerId: currentUser?.role === "reseller" ? currentUser.id : "owner",
  });

  const isOwner = currentUser?.role === "owner";
  const isNoReseller = formData.resellerId === "owner" || formData.resellerId === "";

  useEffect(() => {
    const fetchResellers = async () => {
      try {
        const users = await getSupabaseUsers();
        setResellers(users.filter(u => u.role === "reseller" && u.active));
      } catch (e) {
        toast.error("Gagal mengambil daftar reseller");
      } finally {
        setLoadingInitial(false);
      }
    };
    if (isOwner) fetchResellers();
    else setLoadingInitial(false);
  }, [isOwner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const invoiceNumber = generateInvoiceNumber();

      let file_url = "";
      if (file) {
        // Create unique path based on invoice
        const ext = file.name.split('.').pop();
        const filePath = `${invoiceNumber}/${Date.now()}.${ext}`;
        file_url = await uploadFileToSupabase(file, filePath);
        toast.success("File tugas berhasil diunggah!");
      }

      const newOrder = {
        clientName: formData.clientName,
        serviceType: formData.serviceType as any,
        subject: formData.subject,
        orderDate: formData.orderDate,
        deadline: formData.deadline,
        price: Number(formData.price),
        commissionAmount: isNoReseller ? 0 : Number(formData.commissionAmount || 0),
        commissionPaid: false,
        priority: formData.priority as any,
        status: "Pending" as const,
        notes: formData.notes,
        resellerId: formData.resellerId === "owner" ? undefined : formData.resellerId,
        invoiceNumber,
        invoiceTitle: "Faktur Pembayaran",
        invoiceNotes: "",
        file_url
      };

      const savedOrder = await createSupabaseOrder(newOrder);
      toast.success("Order berhasil ditambahkan! Mengarahkan ke faktur...");

      if (currentUser?.role === "owner") navigate(`/owner/invoice/${savedOrder.id}`);
      else navigate(`/reseller/invoice/${savedOrder.id}`);
      
    } catch (error: any) {
      toast.error("Gagal menyimpan order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentUser?.role === "owner") navigate("/owner");
    else navigate("/reseller");
  };

  if (loadingInitial) {
    return <div className="p-8 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={handleBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Tambah Order Baru</h1>
        <p className="text-slate-500 mt-1">Setelah simpan, kamu akan diarahkan ke halaman faktur</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Informasi Order</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-2">
                <Label>Nama Klien *</Label>
                <Input value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} placeholder="Nama lengkap klien" required />
              </div>

              <div className="space-y-2">
                <Label>Jenis Layanan *</Label>
                <Select value={formData.serviceType} onValueChange={v => setFormData({ ...formData, serviceType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tugas">Tugas</SelectItem>
                    <SelectItem value="Skripsi">Skripsi</SelectItem>
                    <SelectItem value="Makalah">Makalah</SelectItem>
                    <SelectItem value="Essay">Essay</SelectItem>
                    <SelectItem value="Laporan">Laporan</SelectItem>
                    <SelectItem value="Tesis">Tesis</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Subjek/Topik *</Label>
                <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Deskripsi singkat subjek atau topik" required />
              </div>

              {isOwner && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Reseller</Label>
                  <Select value={formData.resellerId} onValueChange={v => setFormData({ ...formData, resellerId: v, commissionAmount: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">— Tanpa Reseller (Owner Sendiri)</SelectItem>
                      {resellers.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Tanggal Order *</Label>
                <Input type="date" value={formData.orderDate} onChange={e => setFormData({ ...formData, orderDate: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Harga (IDR) *</Label>
                <Input
                  type="text"
                  placeholder="Contoh: 500000 atau Seikhlasnya"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              {!isNoReseller && (
                <div className="space-y-2">
                  <Label>Komisi Reseller (Rp)</Label>
                  <Input type="number" min="0" step="1000" value={formData.commissionAmount} onChange={e => setFormData({ ...formData, commissionAmount: e.target.value })} placeholder="Nominal komisi" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Prioritas *</Label>
                <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tinggi">Tinggi</SelectItem>
                    <SelectItem value="Sedang">Sedang</SelectItem>
                    <SelectItem value="Rendah">Rendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 border-dashed">
                <Label className="flex items-center gap-2 mb-2">
                  <UploadCloud className="w-4 h-4 text-slate-600" />
                  Unggah File Pemesan (Opsional)
                </Label>
                <Input 
                  type="file" 
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                  className="bg-white" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg"
                />
                <p className="text-xs text-slate-500 mt-2">File akan otomatis tersimpan ke sistem ruang penyimpanan Ikariz ID.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Catatan</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan tentang order ini..." rows={4} />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1 bg-slate-900 hover:bg-slate-800">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {submitting ? "Menyimpan & Mengunggah..." : "Simpan & Lihat Faktur"}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleBack} disabled={submitting}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}