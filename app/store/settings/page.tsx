"use client";
import { ChangeEvent, useRef } from "react";
import { CogIcon, UploadIcon, TrashIcon, GlobeIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Spinner } from "../components/Spinner";
import { useStoreSettings } from "./hooks/useStoreSettings";
export default function SettingsPage() {
    const {
        store,
        loading,
        saving,
        uploading,
        name,
        slug,
        description,
        phone,
        error,
        setName,
        setSlug,
        setDescription,
        setPhone,
        handleSubmit,
        uploadLogo
    } = useStoreSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);
    function handleLogoClick() {
        fileInputRef.current?.click();
    }
    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        await uploadLogo(file);
        event.target.value = "";
    }
    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-6 py-8">
                <div className="rounded-3xl border border-line bg-surface">
                    <Spinner label="جاري تحميل بيانات المتجر..." />
                </div>
            </div>
        );
    }
    return (
        <div className="mx-auto max-w-3xl px-6 py-8">
            {" "}
            {error && (
                <div className="mb-5 rounded-2xl border border-danger/25 bg-danger-bg px-5 py-4 text-sm font-medium text-danger">
                    {" "}
                    {error}{" "}
                </div>
            )}{" "}
            <div className="mb-6 flex items-center gap-3">
                {" "}
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    {" "}
                    <CogIcon width={22} height={22} />{" "}
                </div>{" "}
                <div>
                    {" "}
                    <h1 className="font-display text-2xl font-semibold text-ink">
                        {" "}
                        إعدادات المتجر{" "}
                    </h1>{" "}
                    <p className="text-sm text-ink-soft">
                        {" "}
                        تعديل بيانات المتجر وشعاره.{" "}
                    </p>{" "}
                </div>{" "}
            </div>{" "}
            <div className="mb-8 rounded-2xl border border-line bg-surface p-6 shadow-sm">
                {" "}
                <h2 className="mb-4 font-display font-semibold text-ink">
                    شعار المتجر
                </h2>{" "}
                <div className="flex items-center gap-5">
                    {" "}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-background">
                        {" "}
                        {store?.logoUrl ? (
                            <img
                                src={store.logoUrl}
                                alt="شعار المتجر"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <GlobeIcon
                                width={32}
                                height={32}
                                className="text-ink-soft/40"
                            />
                        )}{" "}
                    </div>{" "}
                    <div className="flex flex-col gap-2">
                        {" "}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            onChange={handleFileChange}
                            className="hidden"
                        />{" "}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleLogoClick}
                            disabled={uploading}
                        >
                            {" "}
                            <UploadIcon width={14} height={14} />{" "}
                            {uploading
                                ? "جاري الرفع..."
                                : store?.logoUrl
                                  ? "تغيير الشعار"
                                  : "رفع شعار"}{" "}
                        </Button>{" "}
                        {store?.logoUrl && (
                            <p className="text-xs text-ink-soft">
                                انقر لتغيير الشعار الحالي
                            </p>
                        )}{" "}
                    </div>{" "}
                </div>{" "}
            </div>{" "}
            <form onSubmit={handleSubmit} className="space-y-5">
                {" "}
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    {" "}
                    <h2 className="mb-4 font-display font-semibold text-ink">
                        بيانات المتجر
                    </h2>{" "}
                    <div className="grid gap-5 sm:grid-cols-2">
                        {" "}
                        <label className="block sm:col-span-2">
                            {" "}
                            <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                                اسم المتجر
                            </span>{" "}
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="متجر دلالتي"
                                className="w-full rounded-xl border border-line bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                            />{" "}
                        </label>{" "}
                        <label className="block">
                            {" "}
                            <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                                رابط المتجر
                            </span>{" "}
                            <div className="flex items-center overflow-hidden rounded-xl border border-line bg-background focus-within:border-gold">
                                {" "}
                                <span className="bg-surface-alt px-3 text-sm text-ink-soft/80">
                                    /
                                </span>{" "}
                                <input
                                    required
                                    value={slug}
                                    onChange={e =>
                                        setSlug(
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9-]/g, "")
                                        )
                                    }
                                    placeholder="my-store"
                                    className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                                />{" "}
                            </div>{" "}
                        </label>{" "}
                        <label className="block">
                            {" "}
                            <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                                هاتف المتجر (اختياري)
                            </span>{" "}
                            <input
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="77xxxxxxx"
                                className="w-full rounded-xl border border-line bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                            />{" "}
                        </label>{" "}
                        <label className="block sm:col-span-2">
                            {" "}
                            <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                                الوصف (اختياري)
                            </span>{" "}
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                placeholder="وصف قصير للمتجر..."
                                className="w-full rounded-xl border border-line bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                            />{" "}
                        </label>{" "}
                    </div>{" "}
                </div>{" "}
                <div className="flex items-center gap-3">
                    {" "}
                    <Button type="submit" disabled={saving}>
                        {" "}
                        {saving ? "جاري الحفظ..." : "حفظ التغييرات"}{" "}
                    </Button>{" "}
                </div>{" "}
            </form>{" "}
        </div>
    );
}
