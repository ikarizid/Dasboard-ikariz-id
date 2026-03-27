export type UserRole = "owner" | "reseller";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  commissionRate?: number;
  active: boolean;
}

export interface Order {
  id: string;
  clientName: string;
  serviceType: "Tugas" | "Skripsi" | "Makalah" | "Essay" | "Laporan" | "Tesis" | "Lainnya";
  subject: string;
  orderDate: string;
  deadline: string;
  price: string | number;
  priority: "Tinggi" | "Sedang" | "Rendah";
  status: "Pending" | "In Progress" | "Done" | "Cancelled";
  notes: string;
  resellerId: string;
  invoiceNumber: string;
  commissionAmount: number;
  commissionPaid: boolean;
  invoiceTitle?: string;
  invoiceNotes?: string;
  file_url?: string;
  payment_status?: string;
  amount_paid?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  resellerId?: string;
}

export const mockUsers: User[] = [
  { id: "1", username: "owner", password: "owner123", role: "owner", displayName: "Administrator", active: true },
  { id: "2", username: "reseller1", password: "reseller123", role: "reseller", displayName: "Agus Wijaya", commissionRate: 15, active: true },
  { id: "3", username: "reseller2", password: "reseller123", role: "reseller", displayName: "Siti Nurhaliza", commissionRate: 20, active: true },
  { id: "4", username: "reseller3", password: "reseller123", role: "reseller", displayName: "Budi Santoso", commissionRate: 12, active: false },
];

export const mockOrders: Order[] = [
  { id: "INV-001", clientName: "Ahmad Fauzi", serviceType: "Skripsi", subject: "Analisis Pengaruh Media Sosial terhadap Perilaku Konsumen", orderDate: "2026-03-01", deadline: "2026-04-15", price: 5000000, priority: "Tinggi", status: "In Progress", notes: "Bab 1-3 sudah selesai", resellerId: "2", invoiceNumber: "INV-2026-001", commissionAmount: 750000, commissionPaid: true, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
  { id: "INV-002", clientName: "Dewi Lestari", serviceType: "Tugas", subject: "Makalah Manajemen Strategi", orderDate: "2026-03-05", deadline: "2026-03-25", price: 500000, priority: "Sedang", status: "Done", notes: "15 halaman, format APA", resellerId: "2", invoiceNumber: "INV-2026-002", commissionAmount: 75000, commissionPaid: true, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
  { id: "INV-003", clientName: "Rina Kusuma", serviceType: "Tugas", subject: "Tugas Statistika Lanjut", orderDate: "2026-03-10", deadline: "2026-03-22", price: 750000, priority: "Tinggi", status: "Done", notes: "Menggunakan SPSS", resellerId: "3", invoiceNumber: "INV-2026-003", commissionAmount: 150000, commissionPaid: false, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
  { id: "INV-004", clientName: "Yudi Hartono", serviceType: "Skripsi", subject: "Sistem Informasi Berbasis Web untuk E-Commerce", orderDate: "2026-02-20", deadline: "2026-04-30", price: 7500000, priority: "Tinggi", status: "In Progress", notes: "Include source code dan dokumentasi", resellerId: "3", invoiceNumber: "INV-2026-004", commissionAmount: 1500000, commissionPaid: false, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
  { id: "INV-005", clientName: "Linda Wijayanti", serviceType: "Makalah", subject: "Analisis Kebijakan Fiskal Indonesia", orderDate: "2026-03-12", deadline: "2026-03-28", price: 600000, priority: "Sedang", status: "Pending", notes: "20 halaman", resellerId: "2", invoiceNumber: "INV-2026-005", commissionAmount: 90000, commissionPaid: false, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
  { id: "INV-006", clientName: "Eko Prasetyo", serviceType: "Tugas", subject: "Laporan Praktikum Kimia Organik", orderDate: "2026-03-15", deadline: "2026-03-24", price: 400000, priority: "Rendah", status: "Pending", notes: "5 percobaan", resellerId: "3", invoiceNumber: "INV-2026-006", commissionAmount: 50000, commissionPaid: false, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
  { id: "INV-007", clientName: "Putri Amelia", serviceType: "Skripsi", subject: "Pengaruh Kepemimpinan terhadap Kinerja Karyawan", orderDate: "2026-01-15", deadline: "2026-03-20", price: 6000000, priority: "Tinggi", status: "Done", notes: "Sudah ACC pembimbing", resellerId: "2", invoiceNumber: "INV-2026-007", commissionAmount: 900000, commissionPaid: true, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
  { id: "INV-008", clientName: "Rudi Hermawan", serviceType: "Tugas", subject: "Business Plan Startup Digital", orderDate: "2026-03-18", deadline: "2026-03-30", price: 850000, priority: "Sedang", status: "In Progress", notes: "Canvas model dan financial projection", resellerId: "3", invoiceNumber: "INV-2026-008", commissionAmount: 200000, commissionPaid: false, invoiceTitle: "Faktur Pembayaran", invoiceNotes: "" },
];

export const mockRevenueData: RevenueData[] = [
  { month: "Jan", revenue: 12500000 },
  { month: "Feb", revenue: 18750000 },
  { month: "Mar", revenue: 14350000 },
  { month: "Apr", revenue: 0 },
  { month: "Mei", revenue: 0 },
  { month: "Jun", revenue: 0 },
];

export const STORAGE_KEYS = {
  CURRENT_USER: "currentUser",
  ORDERS: "orders",
  USERS: "users",
};

export const getCurrentUser = (): User | null => {
  const userJson = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userJson ? JSON.parse(userJson) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  else sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getOrders = (): Order[] => {
  const ordersJson = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return ordersJson ? JSON.parse(ordersJson) : mockOrders;
};

export const setOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const getUsers = (): User[] => {
  const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
  return usersJson ? JSON.parse(usersJson) : mockUsers;
};

export const setUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const logout = () => {
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};
export interface InvoiceSettings {
  prefix: string;
  lastMonth: string;
  lastNumber: number;
}

export const defaultInvoiceSettings: InvoiceSettings = {
  prefix: "IK",
  lastMonth: "",
  lastNumber: 0,
};

export const INVOICE_SETTINGS_KEY = "invoiceSettings";

export const getInvoiceSettings = (): InvoiceSettings => {
  const raw = localStorage.getItem(INVOICE_SETTINGS_KEY);
  return raw ? JSON.parse(raw) : defaultInvoiceSettings;
};

export const setInvoiceSettings = (settings: InvoiceSettings) => {
  localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(settings));
};

export const generateInvoiceNumber = (): string => {
  const settings = getInvoiceSettings();
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const currentMonth = `${month}-${year}`;

  let nextNumber = 1;
  if (settings.lastMonth === currentMonth) {
    nextNumber = settings.lastNumber + 1;
  }

  const updated: InvoiceSettings = {
    ...settings,
    lastMonth: currentMonth,
    lastNumber: nextNumber,
  };
  setInvoiceSettings(updated);

  return `${settings.prefix}/${month}${year.slice(2)}/${String(nextNumber).padStart(3, "0")}`;
};
if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) setOrders(mockOrders);
if (!localStorage.getItem(STORAGE_KEYS.USERS)) setUsers(mockUsers);