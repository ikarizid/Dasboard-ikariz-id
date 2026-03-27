import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getSupabaseOrders, updateSupabaseOrder } from "../../lib/api";
import { Order } from "../../lib/mock-data";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";

export function Pembayaran() {
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [nominal, setNominal] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = async () => {
    if (!invoiceQuery) return;
    setLoading(true);
    setFoundOrder(null);
    try {
      const orders = await getSupabaseOrders();
      // Cari bedasarkan nomor invoice (Case-insensitive)
      const order = orders.find((o: Order) => 
        o.invoiceNumber.toLowerCase() === invoiceQuery.toLowerCase() || 
        o.id === invoiceQuery
      );
      
      if (order) {
        setFoundOrder(order);
        // Default nominal to the order price if it's numeric
        const priceNum = Number(order.price);
        if (!isNaN(priceNum) && priceNum > 0) {
          setNominal(priceNum.toString());
        } else {
          setNominal(""); // For "Seiklasnya" it's empty by default
        }
      } else {
        toast.error("Invoice tidak ditemukan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan saat mencari data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!foundOrder) return;
    if (!nominal) {
      toast.error("Mohon isi nominal pembayaran");
      return;
    }
    
    setIsProcessing(true);
    try {
      await updateSupabaseOrder(foundOrder.id, {
        payment_status: "Lunas",
        amount_paid: nominal
      });
      toast.success("Pembayaran berhasil diproses dan invoice lunas!");
      setFoundOrder((prev: Order | null) => prev ? { ...prev, payment_status: "Lunas", amount_paid: nominal } : null);
    } catch (e) {
      toast.error("Gagal memproses pembayaran");
    } finally {
      setIsProcessing(false);
    }
  };

  const safeFormatCurrency = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return val; // Retur "Seiklasnya" as string
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Pembayaran</h1>
        <p className="text-slate-500 mt-1">Konfirmasi dan proses pembayaran dari client berdasarkan Invoice.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Invoice</CardTitle>
          <CardDescription>Masukkan nomor invoice (misal: IK/SEM/...) untuk menemukan tagihan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input 
                placeholder="Nomor Invoice..." 
                value={invoiceQuery}
                onChange={(e: { target: { value: string } }) => setInvoiceQuery(e.target.value)}
                onKeyDown={(e: { key: string }) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="bg-[#5B0FAB] hover:bg-[#4a0d8f]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {foundOrder && (
        <Card className="border-t-4 border-t-[#5B0FAB] shadow-md">
          <CardHeader className="bg-slate-50 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Detail Tagihan</CardTitle>
                <div className="text-sm font-medium text-slate-500 mt-1">Invoice: {foundOrder.invoiceNumber}</div>
              </div>
              <Badge variant={foundOrder.payment_status === "Lunas" ? "default" : "destructive"} 
                className={foundOrder.payment_status === "Lunas" ? "bg-green-100 text-green-800" : ""}>
                {foundOrder.payment_status || "Belum Lunas"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-y-4 text-sm border-b pb-6">
              <div>
                <span className="text-slate-500 block mb-1">Klien</span>
                <span className="font-semibold text-base">{foundOrder.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Tanggal & Deadline</span>
                <span className="font-medium">
                  {new Date(foundOrder.orderDate).toLocaleDateString("id-ID")} - {new Date(foundOrder.deadline).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Layanan</span>
                <span className="font-medium">{foundOrder.serviceType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Subjek</span>
                <span className="font-medium">{foundOrder.subject}</span>
              </div>
            </div>

            <div className="bg-[#f5f3ff] p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-[#5B0FAB]">Harga Tagihan Sistem</p>
                <p className="text-xs text-slate-500">Nilai invoice yang tercatat</p>
              </div>
              <div className="text-2xl font-bold text-[#5B0FAB]">
                {safeFormatCurrency(foundOrder.price)}
              </div>
            </div>

            <div className="pt-2">
              <Label className="text-sm font-medium mb-2 block">Masukkan Nominal Pembayaran (Rp)</Label>
              <div className="flex gap-4">
                <Input 
                  type="text" 
                  placeholder="Contoh: 500000 atau nominal seikhlasnya" 
                  value={nominal}
                  onChange={(e: { target: { value: string } }) => setNominal(e.target.value)}
                  className="flex-1 text-lg font-semibold"
                  disabled={foundOrder.payment_status === "Lunas"}
                />
                <Button 
                  size="lg" 
                  onClick={handlePayment} 
                  disabled={isProcessing || foundOrder.payment_status === "Lunas"} 
                  className="bg-green-600 hover:bg-green-700 w-32"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    foundOrder.payment_status === "Lunas" ? (
                      <><CheckCircle2 className="w-5 h-5 mr-2" /> Lunas</>
                    ) : (
                      "Set Lunas"
                    )
                  )}
                </Button>
              </div>
              {foundOrder.payment_status === "Lunas" && foundOrder.amount_paid && (
                <p className="text-green-600 text-sm mt-2 font-medium">Lunas dibayar dengan nominal: {safeFormatCurrency(foundOrder.amount_paid)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
