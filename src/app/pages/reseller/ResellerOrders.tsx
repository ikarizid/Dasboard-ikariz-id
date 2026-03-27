import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { getCurrentUser, Order } from "../../lib/mock-data";
import { getSupabaseOrders } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ResellerOrders() {
  const currentUser = getCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await getSupabaseOrders();
        setOrders(fetchedOrders);
      } catch (e) {
        toast.error("Gagal mengambil data pesanan");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const myOrders = orders.filter(o => o.resellerId === currentUser?.id);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Order Saya</h1>
          <p className="text-slate-500 mt-1">Semua order yang telah Anda buat</p>
        </div>
        <Link to="/reseller/new-order">
          <Button className="bg-slate-900 hover:bg-slate-800">
            <FileText className="w-4 h-4 mr-2" />
            Tambah Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Order ({myOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {myOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg mb-4">Belum ada order</p>
              <Link to="/reseller/new-order">
                <Button className="bg-slate-900 hover:bg-slate-800">
                  Tambah Order Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Klien</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Tanggal Order</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Komisi Saya</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myOrders.map(order => {
                    const orderCommission = (order.price * (currentUser?.commissionRate || 0)) / 100;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                        <TableCell>{order.clientName}</TableCell>
                        <TableCell>{order.serviceType}</TableCell>
                        <TableCell className="max-w-xs truncate">{order.subject}</TableCell>
                        <TableCell>{new Date(order.orderDate).toLocaleDateString('id-ID')}</TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
