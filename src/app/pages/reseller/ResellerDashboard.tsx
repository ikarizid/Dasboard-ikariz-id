import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getCurrentUser, Order, User } from "../../lib/mock-data";
import { getSupabaseOrders, getSupabaseUsers } from "../../lib/api";
import { DollarSign, ShoppingBag, Wallet, Eye, Loader2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export function ResellerDashboard() {
  const currentUser = getCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedUsers, fetchedOrders] = await Promise.all([
          getSupabaseUsers(),
          getSupabaseOrders()
        ]);
        setUsers(fetchedUsers);
        setOrders(fetchedOrders);
      } catch (e) {
        toast.error("Gagal memanggil data dari database");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const myOrders = orders.filter(o => o.resellerId === currentUser?.id);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalOrders = myOrders.length;
    const totalSales = myOrders
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, order) => sum + order.price, 0);
    
    const commissionRate = currentUser?.commissionRate || 0;
    const commission = (totalSales * commissionRate) / 100;

    return { totalOrders, totalSales, commission };
  }, [myOrders, currentUser]);

  const recentOrders = myOrders.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Pending": "secondary",
      "In Progress": "default",
      "Done": "outline",
      "Cancelled": "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
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
     return <div className="p-8 flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard Reseller</h1>
        <p className="text-slate-500 mt-1">Selamat datang, {currentUser?.displayName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Order Saya</CardTitle>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.totalOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Order yang telah dibuat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Penjualan</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(metrics.totalSales)}</div>
            <p className="text-xs text-slate-500 mt-1">Nilai total order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Komisi Earned</CardTitle>
            <Wallet className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(metrics.commission)}</div>
            <p className="text-xs text-slate-500 mt-1">Rate komisi: {currentUser?.commissionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekap Komisi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Rate Komisi</p>
              <p className="text-xl font-semibold">{currentUser?.commissionRate}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Order Selesai</p>
              <p className="text-xl font-semibold">
                {myOrders.filter(o => o.status === "Done").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Order Proses</p>
              <p className="text-xl font-semibold">
                {myOrders.filter(o => o.status === "In Progress").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Order Pending</p>
              <p className="text-xl font-semibold">
                {myOrders.filter(o => o.status === "Pending").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Terbaru</CardTitle>
              <p className="text-sm text-slate-500 mt-1">5 order terbaru Anda</p>
            </div>
            <Link to="/reseller/orders">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Belum ada order</p>
              <Link to="/reseller/new-order">
                <Button className="mt-4 bg-slate-900 hover:bg-slate-800">
                  Tambah Order Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Klien</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Komisi</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map(order => {
                  const orderCommission = (order.price * (currentUser?.commissionRate || 0)) / 100;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                      <TableCell>{order.clientName}</TableCell>
                      <TableCell>{order.serviceType}</TableCell>
                      <TableCell>{new Date(order.deadline).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{formatCurrency(order.price)}</TableCell>
                      <TableCell>{formatCurrency(orderCommission)}</TableCell>
                      <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Link to={`/reseller/invoice/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
