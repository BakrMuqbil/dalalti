'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useToast } from '@/app/store/components/ToastProvider';
import type { DashboardCustomer } from '@/app/store/dashboard/hooks/useDashboardData';

export type Customer = DashboardCustomer;

type CustomersResponse = {
  success: boolean;
  message?: string;
  customers?: Customer[];
  customer?: Customer;
};

async function readJson(response: Response): Promise<CustomersResponse> {
  const data = (await response.json()) as CustomersResponse;
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'حدث خطأ في الطلب');
  }
  return data;
}

export function useCustomers() {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadCustomers() {
    try {
      setLoading(true);
      const url = searchQuery.trim()
        ? `/api/store/customers?q=${encodeURIComponent(searchQuery.trim())}&limit=100`
        : '/api/store/customers?limit=100';
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await readJson(response);
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Load customers failed:', err);
      showToast(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل العملاء',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadCustomers();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  function resetForm() {
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      showToast('اسم العميل ورقم الهاتف مطلوبان', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/store/customers/${editingId}`
        : '/api/store/customers';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
          address: address.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await readJson(response);

      showToast(
        editingId ? 'تم تحديث بيانات العميل بنجاح' : 'تم إضافة العميل بنجاح',
        'success',
      );

      resetForm();
      void loadCustomers();
    } catch (err) {
      console.error('Submit customer failed:', err);
      showToast(
        err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ العميل',
        'error',
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(customer: Customer) {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address ?? '');
    setNotes(customer.notes ?? '');
  }

  async function handleDelete(customerId: string) {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا العميل؟');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/store/customers/${customerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await readJson(response);
      showToast('تم حذف العميل بنجاح', 'success');
      void loadCustomers();
    } catch (err) {
      console.error('Delete customer failed:', err);
      showToast(
        err instanceof Error ? err.message : 'حدث خطأ أثناء حذف العميل',
        'error',
      );
    }
  }

  return {
    customers,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    notes,
    setNotes,
    editingId,
    handleSubmit,
    startEditing,
    handleDelete,
    resetForm,
  };
}
