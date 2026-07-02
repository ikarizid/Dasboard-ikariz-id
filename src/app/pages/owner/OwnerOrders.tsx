import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Order, User } from "../../lib/mock-data";
import { getSupabaseOrders, getSupabaseUsers, updateSupabaseOrder, deleteSupabaseOrder, uploadFileToSupabase } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../components/ui/dialog";
import { Eye, FileText, Trash2, Edit, UploadCloud, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "../../components/ui/checkbox";

export function OwnerOrders() {
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Delete State
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Bulk Action State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  
  // Edit Form State
  const [formData, setFormData] = useState<Partial<Order>>({});
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedOrders] = await Promise.all([
        getSupabaseUsers(),
        getSupabaseOrders()
      ]);
      setUsers(fetchedUsers);
      setOrdersState(fetchedOrders);
    } catch (e) {
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resellers = users.filter(u => u.role === "reseller");

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Optimistic UI update
    setOrdersState(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    
    try {
      await updateSupabaseOrder(orderId, { status: newStatus as any });
      toast.success("Status order diperbarui");
    } catch (error) {
      toast.error("Gagal mengubah status");
      loadData();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(orders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectRow = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const executeBulkDelete = async () => {
    setSubmitting(true);
    try {
      await Promise.all(selectedOrderIds.map(id => deleteSupabaseOrder(id)));
      toast.success(`${selectedOrderIds.length} order berhasil dihapus`);
      setSelectedOrderIds([]);
      setBulkDeleteOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus order secara massal: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    
    // Optimistic UI update
    setOrdersState(prev => prev.map(o => selectedOrderIds.includes(o.id) ? { ...o, status: newStatus as any } : o));
    
    try {
      await Promise.all(selectedOrderIds.map(id => updateSupabaseOrder(id, { status: newStatus as any })));
      toast.success(`Status ${selectedOrderIds.length} order diperbarui menjadi ${newStatus}`);
      setSelectedOrderIds([]); // Clear selection after bulk update
    } catch (error: any) {
      toast.error("Gagal mengubah status secara massal: " + error.message);
      loadData(); // Revert on failure
    }
  };

  const openEdit = (order: Order) => {
    setSelectedOrder(order);
    setFormData(order);
    setFile(null);
    setEditOpen(true);
  };

  const openDelete = (order: Order) => {
    setSelectedOrder(order);
    setDeleteOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      let file_url = formData.file_url;
      if (file) {
        const ext = file.name.split('.').pop();
        const filePath = `${formData.invoiceNumber}/${Date.now()}.${ext}`;
        file_url = await uploadFileToSupabase(file, filePath);
        toast.success("File baru berhasil diunggah!");
      }

      await updateSupabaseOrder(selectedOrder.id, {
        ...formData,
        price: Number(formData.price),
        commissionAmount: Number(formData.commissionAmount),
        file_url
      });

      toast.success("Order berhasil diperbarui");
      setEditOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Gagal menyimpan perubahan: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await deleteSupabaseOrder(selectedOrder.id);
      toast.success("Order berhasil dihapus");
      setDeleteOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      "Tinggi": "bg-red-100 text-red-800",
      "Sedang": "bg-yellow-100 text-yellow-800",
      "Rendah": "bg-green-100 text-green-800",
    };
    return (
      <Badge variant="outline" className={colors[priority] || ""}>
        {priority}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Semua Order</h1>
          <p className="text-slate-500 mt-1">Kelola semua order dan file dari database Supabase</p>
        </div>
        <Link to="/owner/new-order">
          <Button className="bg-slate-900 hover:bg-slate-800">
            <FileText className="w-4 h-4 mr-2" />
            Tambah Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Daftar Order ({orders.length})</CardTitle>
          
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
              <span className="text-sm font-medium text-slate-700 px-2">{selectedOrderIds.length} dipilih</span>
              <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>
              
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-36 h-8 text-xs bg-white">
                  <SelectValue placeholder="Ubah Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="destructive" size="sm" className="h-8" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="w-4 h-4 mr-1" /> Hapus
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Pilih semua"
                    />
                  </TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Klien</TableHead>
                  <TableHead>Layanan / Subjek</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const reseller = resellers.find(r => r.id === order.resellerId);
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <TableRow key={order.id} className={isSelected ? "bg-slate-50/50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(order.id, checked as boolean)}
                          aria-label={`Pilih order ${order.invoiceNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{order.invoiceNumber}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.clientName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <span className="font-medium">{order.serviceType}</span>
                        <p className="text-xs text-slate-500 truncate">{order.subject}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{reseller?.displayName || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{new Date(order.deadline).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(order.price)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.payment_status === "Lunas" ? "default" : "destructive"} className={order.payment_status === "Lunas" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                          {order.payment_status || "Belum Lunas"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.file_url ? (
                          <a href={order.file_url} target="_blank" rel="noreferrer" title="Unduh File">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer">
                              <Download className="w-3 h-3 mr-1" />
                              Unduh
                            </Badge>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link to={`/owner/invoice/${order.id}`}>
                            <Button variant="ghost" size="sm" title="Lihat Faktur">
                              <Eye className="w-4 h-4 text-slate-600" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="Edit Data & File" onClick={() => openEdit(order)}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Hapus Order" onClick={() => openDelete(order)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus order <strong>{selectedOrder?.invoiceNumber}</strong> ({selectedOrder?.clientName})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Massal</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedOrderIds.length}</strong> order yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button variant="destructive" onClick={executeBulkDelete} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Ubah data pesanan atau unggah file revisi/hasil tugas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nama Klien</Label>
                <Input value={formData.clientName || ""} onChange={e => setFormData({ ...formData, clientName: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Deadline</Label>
                <Input type="date" value={formData.deadline || ""} onChange={e => setFormData({ ...formData, deadline: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subjek/Topik</Label>
                <Input value={formData.subject || ""} onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Harga (IDR)</Label>
                <Input type="number" value={formData.price || ""} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 border-dashed mt-4 space-y-3">
              <Label className="flex items-center gap-2 text-slate-800">
                <UploadCloud className="w-4 h-4" />
                Unggah File Baru / File Revisi
              </Label>
              {formData.file_url && !file && (
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  Sudah ada file yang terlampir. Unggah file baru untuk menggantinya.
                </div>
              )}
              <Input 
                type="file" 
                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                className="bg-white" 
              />
              <p className="text-xs text-slate-500">File akan menggantikan file sebelumnya (jika ada) di Supabase Storage.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>Batal</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>

        </DialogContent>
      </Dialog>
    </div>
  );
}
