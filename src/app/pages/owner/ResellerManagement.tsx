import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { User, Order } from "../../lib/mock-data";
import { getSupabaseUsers, createSupabaseReseller, updateSupabaseReseller, getSupabaseOrders, setSupabaseOrderCommissionPaid } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { UserPlus, Edit, UserX, UserCheck, Eye, EyeOff, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ResellerManagement() {
  const [users, setUsersState] = useState<User[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedResellerId, setSelectedResellerId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    commissionRate: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedOrders] = await Promise.all([
        getSupabaseUsers(),
        getSupabaseOrders()
      ]);
      setUsersState(fetchedUsers);
      setOrdersState(fetchedOrders);
    } catch (error) {
      toast.error("Gagal mengambil data dari database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resellers = users.filter(u => u.role === "reseller");

  const resetForm = () => {
    setFormData({ username: "", password: "", displayName: "", commissionRate: "" });
    setEditingId(null);
    setShowPassword(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const handleEdit = (resellerId: string) => {
    const reseller = users.find(u => u.id === resellerId);
    if (reseller) {
      setFormData({
        username: reseller.username,
        password: reseller.password,
        displayName: reseller.displayName,
        commissionRate: String(reseller.commissionRate || 0),
      });
      setEditingId(resellerId);
      setOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        // Find existing to preserve active status
        const existing = users.find(u => u.id === editingId);
        await updateSupabaseReseller(editingId, {
          username: formData.username,
          displayName: formData.displayName,
          commissionRate: Number(formData.commissionRate),
          active: existing?.active ?? true
        });
        toast.success("Reseller berhasil diperbarui");
      } else {
        await createSupabaseReseller({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName,
          commissionRate: Number(formData.commissionRate)
        });
        toast.success("Reseller baru berhasil ditambahkan");
      }
      setOpen(false);
      resetForm();
      loadData(); // reload
    } catch (error: any) {
      toast.error("Gagal menyimpan data: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (resellerId: string) => {
    const reseller = users.find(u => u.id === resellerId);
    if (!reseller) return;
    
    // Optimistic UI update
    setUsersState(prev => prev.map(u => u.id === resellerId ? { ...u, active: !u.active } : u));
    
    try {
      await updateSupabaseReseller(resellerId, {
        username: reseller.username,
        displayName: reseller.displayName,
        commissionRate: reseller.commissionRate,
        active: !reseller.active
      });
      toast.success(`${reseller.displayName} ${!reseller.active ? "diaktifkan" : "dinonaktifkan"}`);
    } catch (error) {
      toast.error("Gagal mengubah status");
      loadData(); // revert on fail
    }
  };

  const handleToggleCommissionPaid = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Optimistic update
    setOrdersState(prev => prev.map(o => o.id === orderId ? { ...o, commissionPaid: !o.commissionPaid } : o));

    try {
      await setSupabaseOrderCommissionPaid(orderId, !order.commissionPaid);
      toast.success("Status komisi diperbarui");
    } catch (error) {
      toast.error("Gagal mengubah status komisi");
      loadData(); // revert on fail
    }
  };

  const getResellerStats = (resellerId: string) => {
    const resellerOrders = orders.filter(o => o.resellerId === resellerId && o.status !== "Cancelled");
    const totalOrders = orders.filter(o => o.resellerId === resellerId).length;
    const totalSales = resellerOrders.reduce((sum, o) => sum + o.price, 0);
    const totalCommission = resellerOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
    const paidCommission = resellerOrders.filter(o => o.commissionPaid).reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
    const unpaidCommission = totalCommission - paidCommission;
    const uniqueClients = new Set(resellerOrders.map(o => o.clientName)).size;
    return { totalOrders, totalSales, totalCommission, paidCommission, unpaidCommission, uniqueClients };
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const selectedReseller = selectedResellerId ? users.find(u => u.id === selectedResellerId) : null;
  const selectedResellerOrders = selectedResellerId
    ? orders.filter(o => o.resellerId === selectedResellerId)
    : [];

  const totalUnpaidAll = resellers.reduce((sum, r) => sum + getResellerStats(r.id).unpaidCommission, 0);

  if (loading) {
    return <div className="p-8 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Kelola Reseller</h1>
          <p className="text-slate-500 mt-1">Tambah, edit, dan kelola akun reseller dari Database Supabase</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Reseller
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Reseller" : "Tambah Reseller Baru"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Perbarui informasi reseller" : "Buat akun reseller baru ke Supabase"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Username (Tanpa Spasi)</Label>
                <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })} disabled={!!editingId} required placeholder="contoh: bagus123" />
                {!editingId && <p className="text-xs text-slate-500">Akan dibuatkan email: {formData.username || 'username'}@ikariz.id</p>}
              </div>
              {!editingId && (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="pr-10"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Rate Komisi (%)</Label>
                <Input type="number" min="0" max="100" step="0.1" value={formData.commissionRate} onChange={e => setFormData({ ...formData, commissionRate: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1 bg-slate-900 hover:bg-slate-800">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingId ? "Perbarui" : "Tambah"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)} disabled={submitting}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {totalUnpaidAll > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Total hutang komisi yang belum dibayar:{" "}
            <span className="font-semibold">{formatCurrency(totalUnpaidAll)}</span>
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Reseller</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Total Order</TableHead>
                <TableHead>Total Penjualan</TableHead>
                <TableHead>Komisi Earned</TableHead>
                <TableHead>Hutang Komisi</TableHead>
                <TableHead>Status Komisi</TableHead>
                <TableHead>Status Akun</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resellers.map(reseller => {
                const stats = getResellerStats(reseller.id);
                return (
                  <TableRow key={reseller.id}>
                    <TableCell className="font-medium">{reseller.displayName}</TableCell>
                    <TableCell className="text-slate-500">{reseller.username}</TableCell>
                    <TableCell>{stats.totalOrders}</TableCell>
                    <TableCell>{formatCurrency(stats.totalSales)}</TableCell>
                    <TableCell>{formatCurrency(stats.totalCommission)}</TableCell>
                    <TableCell>
                      <span className={stats.unpaidCommission > 0 ? "text-red-600 font-semibold" : "text-slate-400"}>
                        {formatCurrency(stats.unpaidCommission)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stats.unpaidCommission > 0 ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Ada Hutang</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Lunas</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {reseller.active ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { setSelectedResellerId(reseller.id); setDetailOpen(true); }}
                          title="Lihat Detail"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(reseller.id)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(reseller.id)}>
                          {reseller.active
                            ? <UserX className="w-4 h-4 text-red-500" />
                            : <UserCheck className="w-4 h-4 text-green-600" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {resellers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                    Belum ada data reseller
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Reseller Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedReseller && (() => {
            const stats = getResellerStats(selectedReseller.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Detail Reseller — {selectedReseller.displayName}</DialogTitle>
                  <DialogDescription>Riwayat order dan rekap komisi</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Total Order</p>
                    <p className="text-xl font-semibold">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Total Client</p>
                    <p className="text-xl font-semibold">{stats.uniqueClients}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Komisi Earned</p>
                    <p className="text-base font-semibold">{formatCurrency(stats.totalCommission)}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stats.unpaidCommission > 0 ? "bg-red-50" : "bg-green-50"}`}>
                    <p className={`text-xs ${stats.unpaidCommission > 0 ? "text-red-500" : "text-green-600"}`}>Hutang Komisi</p>
                    <p className={`text-base font-semibold ${stats.unpaidCommission > 0 ? "text-red-600" : "text-green-700"}`}>
                      {formatCurrency(stats.unpaidCommission)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-sm text-slate-700 mb-3">Daftar Order</h3>
                  {selectedResellerOrders.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">Belum ada order</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedResellerOrders.map(order => (
                        <div key={order.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{order.clientName}</span>
                                <span className="text-slate-400 text-xs">{order.invoiceNumber}</span>
                                <Badge variant="outline" className={
                                  order.status === "Done" ? "bg-green-50 text-green-700 border-green-200 text-xs" :
                                  order.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200 text-xs" :
                                  order.status === "Cancelled" ? "bg-red-50 text-red-700 border-red-200 text-xs" :
                                  "bg-slate-50 text-slate-600 border-slate-200 text-xs"
                                }>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-slate-500 text-xs mt-1">{order.serviceType} — {order.subject}</p>
                              <p className="text-slate-400 text-xs">
                                Deadline: {new Date(order.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold">{formatCurrency(order.price)}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Komisi: {formatCurrency(order.commissionAmount || 0)}</p>
                              <button
                                onClick={() => handleToggleCommissionPaid(order.id)}
                                className={`mt-1 text-xs px-2 py-0.5 rounded-full border font-medium transition-colors cursor-pointer ${
                                  order.commissionPaid
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                {order.commissionPaid ? "✓ Lunas" : "✗ Belum Dibayar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
