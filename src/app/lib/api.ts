import { supabase } from "./supabase";
import { User, Order, RevenueData } from "./mock-data";

export const getSupabaseUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data.map(p => ({
    id: p.id,
    username: p.username,
    password: "", // do not fetch password
    role: p.role,
    displayName: p.display_name,
    commissionRate: p.commission_rate,
    active: p.active
  }));
};

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const createAuthClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export const createSupabaseReseller = async (user: Partial<User>) => {
  const email = `${user.username}@ikariz.id`;
  
  const { data: authData, error: authError } = await createAuthClient.auth.signUp({
    email,
    password: user.password || "default123",
  });

  if (authError) throw authError;

  if (authData.user) {
    const { data: profile, error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username: user.username,
      role: 'reseller',
      display_name: user.displayName,
      commission_rate: user.commissionRate,
      active: true
    }).select().single();

    if (profileError) throw profileError;
    return profile;
  }
};

export const updateSupabaseReseller = async (id: string, updates: Partial<User>) => {
  const { data, error } = await supabase.from('profiles').update({
    username: updates.username,
    display_name: updates.displayName,
    commission_rate: updates.commissionRate,
    active: updates.active
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const getSupabaseOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data.map(o => ({
    id: o.id,
    clientName: o.client_name,
    serviceType: o.service_type as any,
    subject: o.subject,
    orderDate: o.order_date,
    deadline: o.deadline,
    price: o.price,
    priority: o.priority as any,
    status: o.status as any,
    notes: o.notes,
    resellerId: o.reseller_id,
    invoiceNumber: o.invoice_number,
    commissionAmount: o.commission_amount,
    commissionPaid: o.commission_paid,
    invoiceTitle: o.invoice_title,
    invoiceNotes: o.invoice_notes,
    file_url: o.file_url,
    payment_status: o.payment_status,
    amount_paid: o.amount_paid
  }));
};

export const setSupabaseOrderCommissionPaid = async (id: string, paid: boolean) => {
  const { error } = await supabase.from('orders').update({ commission_paid: paid }).eq('id', id);
  if (error) throw error;
};

export const createSupabaseOrder = async (order: Partial<Order>) => {
  const { data, error } = await supabase.from('orders').insert({
    client_name: order.clientName,
    service_type: order.serviceType,
    subject: order.subject,
    order_date: order.orderDate,
    deadline: order.deadline,
    price: order.price,
    priority: order.priority,
    status: order.status,
    notes: order.notes,
    reseller_id: order.resellerId,
    invoice_number: order.invoiceNumber,
    commission_amount: order.commissionAmount,
    commission_paid: order.commissionPaid,
    invoice_title: order.invoiceTitle,
    invoice_notes: order.invoiceNotes,
    file_url: order.file_url,
    payment_status: order.payment_status,
    amount_paid: order.amount_paid
  }).select().single();
  if (error) throw error;
  return data;
};

export const updateSupabaseOrder = async (id: string, order: Partial<Order>) => {
  const updates: any = {};
  if (order.clientName !== undefined) updates.client_name = order.clientName;
  if (order.serviceType !== undefined) updates.service_type = order.serviceType;
  if (order.subject !== undefined) updates.subject = order.subject;
  if (order.deadline !== undefined) updates.deadline = order.deadline;
  if (order.price !== undefined) updates.price = order.price;
  if (order.priority !== undefined) updates.priority = order.priority;
  if (order.status !== undefined) updates.status = order.status;
  if (order.notes !== undefined) updates.notes = order.notes;
  if (order.commissionAmount !== undefined) updates.commission_amount = order.commissionAmount;
  if (order.file_url !== undefined) updates.file_url = order.file_url;
  if (order.payment_status !== undefined) updates.payment_status = order.payment_status;
  if (order.amount_paid !== undefined) updates.amount_paid = order.amount_paid;
  
  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteSupabaseOrder = async (id: string) => {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
};

export const uploadFileToSupabase = async (file: File, path: string) => {
  const { data, error } = await supabase.storage.from('order-files').upload(path, file, {
    upsert: true
  });
  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage.from('order-files').getPublicUrl(path);
  return publicUrlData.publicUrl;
};
