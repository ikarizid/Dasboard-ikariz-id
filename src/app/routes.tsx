import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { OwnerLayout } from "./layouts/OwnerLayout";
import { ResellerLayout } from "./layouts/ResellerLayout";
import { OwnerDashboard } from "./pages/owner/OwnerDashboard";
import { ResellerManagement } from "./pages/owner/ResellerManagement";
import { OwnerOrders } from "./pages/owner/OwnerOrders";
import { InvoiceSettings } from "./pages/owner/InvoiceSettings";
import { ResellerDashboard } from "./pages/reseller/ResellerDashboard";
import { ResellerOrders } from "./pages/reseller/ResellerOrders";
import { NewOrder } from "./pages/NewOrder";
import { Invoice } from "./pages/Invoice";

export const router = createBrowserRouter([
  { path: "/", Component: LoginPage },
  {
    path: "/owner",
    Component: OwnerLayout,
    children: [
      { index: true, Component: OwnerDashboard },
      { path: "resellers", Component: ResellerManagement },
      { path: "orders", Component: OwnerOrders },
      { path: "new-order", Component: NewOrder },
      { path: "invoice/:orderId", Component: Invoice },
      { path: "invoice-settings", Component: InvoiceSettings },
    ],
  },
  {
    path: "/reseller",
    Component: ResellerLayout,
    children: [
      { index: true, Component: ResellerDashboard },
      { path: "orders", Component: ResellerOrders },
      { path: "new-order", Component: NewOrder },
      { path: "invoice/:orderId", Component: Invoice },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);