"use client";

import { useState } from "react";

type StoreShareCardProps = {
  storeSlug: string;
  storeName?: string;
};

function LinkSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
      <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.15-1.15" />
    </svg>
  );
}

function ExternalLinkSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function CopySvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4" />
      <path d="m15.4 6.5-6.8 4" />
    </svg>
  );
}

export default function StoreShareCard({
  storeSlug,
  storeName = "متجرك",
}: StoreShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  /*
   * مهم:
   * لا نستخدم window.location.origin هنا أثناء عملية render.
   *
   * السبب:
   * Server Render لا يمتلك window، بينما Client Render يمتلكه،
   * وهذا كان يسبب Hydration Mismatch.
   *
   * استخدام المسار النسبي يجعل Server و Client ينتجان نفس HTML.
   */
  const storePath = `/${storeSlug}`;

  /*
   * نحصل على الرابط الكامل فقط عند الحاجة إليه.
   * هذه الدالة تُستدعى من أزرار التفاعل بعد تحميل الصفحة،
   * لذلك استخدام window هنا آمن ولا يسبب Hydration Error.
   */
  const getAbsoluteStoreUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${storePath}`;
    }

    return storePath;
  };

  const handleCopy = async () => {
    const url = getAbsoluteStoreUrl();

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);
      }

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy store URL:", error);
    }
  };

  const handleShare = async () => {
    if (sharing) {
      return;
    }

    setSharing(true);

    try {
      const url = getAbsoluteStoreUrl();

      if (navigator.share) {
        await navigator.share({
          title: storeName,
          text: `تفضل بزيارة ${storeName}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      /*
       * AbortError يعني أن المستخدم أغلق نافذة المشاركة.
       * لا نحتاج لإظهار خطأ في هذه الحالة.
       */
      if ((error as Error)?.name !== "AbortError") {
        console.error("Failed to share store URL:", error);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleOpenStore = () => {
    const url = getAbsoluteStoreUrl();

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      dir="rtl"
      className="mb-8 mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <LinkSvg className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">
              رابط متجرك
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              شارك رابط متجرك مع عملائك ليتمكنوا من تصفح المنتجات والطلب
              مباشرة.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 sm:px-6">
        {/* Store URL */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p
                dir="ltr"
                className="truncate text-left text-sm font-medium text-slate-700"
                title={storePath}
              >
                {storePath}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <CopySvg className="h-4 w-4" />

              {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Open Store */}
          <button
            type="button"
            onClick={handleOpenStore}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <ExternalLinkSvg className="h-5 w-5" />

            فتح المتجر
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShareSvg className="h-5 w-5" />

            {sharing ? "جاري المشاركة..." : "مشاركة الرابط"}
          </button>
        </div>

        {/* Copy Feedback */}
        {copied && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700"
          >
            تم نسخ رابط المتجر بنجاح
          </div>
        )}
      </div>
    </section>
  );
}