"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useToast } from "@/hooks/useToast";
import { fetchWithAuth, readJson } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

const DEFAULT_THEME = {
  primaryColor: "#7A5C3E",
  secondaryColor: "#5E4530",
  accentColor: "#B8862E",
  backgroundColor: "#FAF7F2",
  textColor: "#2B2420",
};

type Theme = typeof DEFAULT_THEME;

const FIELDS: Array<{
  key: keyof Theme;
  label: string;
  description: string;
}> = [
  { key: "primaryColor", label: "اللون الأساسي", description: "الأزرار والعناصر الرئيسية" },
  { key: "secondaryColor", label: "اللون الثانوي", description: "العناصر الداكنة والعناوين البارزة" },
  { key: "accentColor", label: "لون التمييز", description: "الروابط والتفاصيل البصرية" },
  { key: "backgroundColor", label: "لون الخلفية", description: "الخلفية الرئيسية لواجهة المتجر" },
  { key: "textColor", label: "لون النص", description: "النصوص الأساسية في المتجر" },
];

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function StoreThemeSettings() {
  const { showToast } = useToast();
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      try {
        const response = await fetchWithAuth("/api/store/settings/theme");
        const data = await readJson<{ theme: Theme }>(response);

        if (!cancelled && data.theme) {
          setTheme({
            primaryColor: data.theme.primaryColor,
            secondaryColor: data.theme.secondaryColor,
            accentColor: data.theme.accentColor,
            backgroundColor: data.theme.backgroundColor,
            textColor: data.theme.textColor,
          });
        }
      } catch (error) {
        if (!cancelled) {
          showToast(
            error instanceof Error ? error.message : "تعذر تحميل مظهر المتجر",
            "error",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTheme();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  function updateColor(key: keyof Theme, value: string) {
    setTheme((current) => ({ ...current, [key]: value }));
  }

  function resetTheme() {
    setTheme(DEFAULT_THEME);
  }

  async function handleSave() {
    const invalid = Object.values(theme).some((value) => !isHexColor(value));

    if (invalid) {
      showToast("يرجى إدخال ألوان صحيحة بصيغة Hex مثل #7A5C3E", "warning");
      return;
    }

    setSaving(true);

    try {
      const response = await fetchWithAuth("/api/store/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });

      const data = await readJson<{ theme: Theme; message?: string }>(response);
      setTheme(data.theme);
      showToast(data.message || "تم حفظ مظهر المتجر بنجاح", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر حفظ مظهر المتجر",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  const previewStyle = {
    "--preview-primary": theme.primaryColor,
    "--preview-secondary": theme.secondaryColor,
    "--preview-accent": theme.accentColor,
    "--preview-background": theme.backgroundColor,
    "--preview-text": theme.textColor,
  } as CSSProperties;

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-display font-semibold text-ink">مظهر المتجر</h2>
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          خصص ألوان واجهة متجرك. التغييرات تؤثر على المتجر العام فقط ولا تغيّر لوحة التحكم.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-background px-4 py-8 text-center text-sm text-ink-soft">
          جاري تحميل المظهر...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label
                key={field.key}
                className="rounded-xl border border-line bg-background p-4"
              >
                <span className="mb-1 block text-sm font-semibold text-ink">
                  {field.label}
                </span>
                <span className="mb-3 block text-xs text-ink-soft">
                  {field.description}
                </span>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={isHexColor(theme[field.key]) ? theme[field.key] : "#000000"}
                    onChange={(event) => updateColor(field.key, event.target.value.toUpperCase())}
                    className="h-11 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
                    aria-label={field.label}
                  />
                  <input
                    value={theme[field.key]}
                    onChange={(event) => updateColor(field.key, event.target.value.toUpperCase())}
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm uppercase text-ink outline-none focus:border-gold"
                    placeholder="#000000"
                    maxLength={7}
                    spellCheck={false}
                    dir="ltr"
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">معاينة</h3>
                <p className="text-xs text-ink-soft">هذه معاينة تقريبية قبل فتح المتجر.</p>
              </div>
            </div>

            <div
              style={previewStyle}
              className="overflow-hidden rounded-2xl border border-line"
            >
              <div
                className="px-5 py-4"
                style={{ backgroundColor: "var(--preview-background)", color: "var(--preview-text)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">متجرك</p>
                    <p className="mt-1 text-xs opacity-70">واجهة المتجر</p>
                  </div>
                  <span
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: "var(--preview-primary)" }}
                  >
                    تصفح المنتجات
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-white p-3 shadow-sm"
                    >
                      <div
                        className="mb-3 h-16 rounded-lg"
                        style={{ backgroundColor: "var(--preview-accent)" }}
                      />
                      <div
                        className="h-2 w-3/4 rounded-full"
                        style={{ backgroundColor: "var(--preview-secondary)" }}
                      />
                      <div
                        className="mt-2 h-2 w-1/2 rounded-full opacity-30"
                        style={{ backgroundColor: "var(--preview-text)" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ المظهر"}
            </Button>

            <Button type="button" variant="secondary" onClick={resetTheme} disabled={saving}>
              استعادة الافتراضي
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
