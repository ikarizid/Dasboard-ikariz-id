import { useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { getOrders, setOrders, getUsers } from "../../lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Eye, FileText } from "lucide-react";
import { toast } from "sonner";

export function OwnerOrders() {
  const [orders, setOrdersState] = useState(getOrders());
  const users = getUsers();
  const resellers = users.filter(u => u.role === "reseller");

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus as any };
      }
      return o;
    });
    
    setOrders(updatedOrders);
    setOrdersState(updatedOrders);
    toast.success("Status order diperbarui");
  };

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

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Semua Order</h1>
          <p className="text-slate-500 mt-1">Kelola semua order dari semua reseller</p>
        </div>
        <Link to="/owner/new-order">
          <Button className="bg-slate-900 hover:bg-slate-800">
            <FileText className="w-4 h-4 mr-2" />
            Tambah Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Order ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Klien</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Subjek</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Tanggal Order</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const reseller = resellers.find(r => r.id === order.resellerId);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                      <TableCell>{order.clientName}</TableCell>
                      <TableCell>{order.serviceType}</TableCell>
                      <TableCell className="max-w-xs truncate">{order.subject}</TableCell>
                      <TableCell>{reseller?.displayName || "-"}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{new Date(order.deadline).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{formatCurrency(order.price)}</TableCell>
                      <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-36">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
