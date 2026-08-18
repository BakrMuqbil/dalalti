'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { readJson, fetchWithAuth } from '@/lib/api-client';
import type { DashboardCustomer } from '@/app/store/dashboard/hooks/useDashboardData';

export type Customer = DashboardCustomer & {
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

type CustomersResponse = {
  success: boolean;
  message?: string;
  customers?: Customer[];
  customer?: Customer;
};

export function useCustomers() {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadCustomers() {
    try {
      setLoading(true);
      const url = searchQuery.trim()
        ? `/api/store/customers?q=${encodeURIComponent(searchQuery.trim())}&limit=100`
        : '/api/store/customers?limit=100';
      const response = await fetchWithAuth(url);
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
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function resetForm() {
    setName('');
    setPhone('');
    setEmail('');
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

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
          email: email.trim(),
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
    setEmail(customer.email ?? '');
    setAddress(customer.address ?? '');
    setNotes(customer.notes ?? '');
  }

  async function handleDelete(customerId: string) {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا العميل؟');
    if (!confirmed) return;

    try {
      const response = await fetchWithAuth(`/api/store/customers/${customerId}`, {
        method: 'DELETE',
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
    email,
    setEmail,
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
