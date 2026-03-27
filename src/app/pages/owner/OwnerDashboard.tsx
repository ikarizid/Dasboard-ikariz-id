import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Order, User } from "../../lib/mock-data";
import { getSupabaseOrders, getSupabaseUsers } from "../../lib/api";
import { toast } from "sonner";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Wallet,
  FileText,
  Eye,
  Loader2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

export function OwnerDashboard() {
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
        toast.error("Gagal memuat data dari database");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resellers = users.filter(u => u.role === "reseller");
  
  const [selectedReseller, setSelectedReseller] = useState<string>("all");

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, order) => sum + (Number(order.price) || 0), 0);
    
    const totalCommission = orders
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, order) => {
        const reseller = resellers.find(r => r.id === order.resellerId);
        const commission = reseller ? ((Number(order.price) || 0) * (reseller.commissionRate || 0)) / 100 : 0;
        return sum + commission;
      }, 0);
    
    const netProfit = totalRevenue - totalCommission;

    return { totalOrders, totalRevenue, totalCommission, netProfit };
  }, [orders, resellers]);

  // Revenue by month
  const revenueByMonth = useMemo(() => {
    const monthlyData: Record<string, number> = {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
    };

    orders.forEach(order => {
      if (order.status === "Cancelled") return;
      if (selectedReseller !== "all" && order.resellerId !== selectedReseller) return;
      
      const month = new Date(order.orderDate).toLocaleString('id-ID', { month: 'short' });
      if (monthlyData[month] !== undefined) {
        monthlyData[month] += (Number(order.price) || 0);
      }
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }, [orders, selectedReseller]);

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  const safeFormatCurrency = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
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
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard Owner</h1>
        <p className="text-slate-500 mt-1">Ringkasan bisnis dan performa reseller</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Order</CardTitle>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.totalOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Semua reseller</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pendapatan</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{safeFormatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-slate-500 mt-1">Revenue kotor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Komisi Dibayarkan</CardTitle>
            <Wallet className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{safeFormatCurrency(metrics.totalCommission)}</div>
            <p className="text-xs text-slate-500 mt-1">Total komisi reseller</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pendapatan Bersih</CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{safeFormatCurrency(metrics.netProfit)}</div>
            <p className="text-xs text-slate-500 mt-1">Setelah komisi</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grafik Pendapatan</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Pendapatan per bulan</p>
            </div>
            <Select value={selectedReseller} onValueChange={setSelectedReseller}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih reseller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Reseller</SelectItem>
                {resellers.map(reseller => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                formatter={(value: number) => safeFormatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0f172a" 
                strokeWidth={2}
                name="Pendapatan"
                dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Terbaru</CardTitle>
              <p className="text-sm text-slate-500 mt-1">5 order terbaru dari semua reseller</p>
            </div>
            <Link to="/owner/orders">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Klien</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Reseller</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map(order => {
                const reseller = resellers.find(r => r.id === order.resellerId);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell>{order.clientName}</TableCell>
                    <TableCell>{order.serviceType}</TableCell>
                    <TableCell>{reseller?.displayName || "-"}</TableCell>
                    <TableCell>{new Date(order.deadline).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{safeFormatCurrency(order.price)}</TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Link to={`/owner/invoice/${order.id}`}>
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
        </CardContent>
      </Card>
    </div>
  );
}
