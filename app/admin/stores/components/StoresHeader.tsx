"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
type Props = { onRefresh: () => void; onAdd: () => void };
export function StoresHeader({ onRefresh, onAdd }: Props) {
  return (
    <PageHeader
      label="DALALTI · ADMIN"
      title="إدارة المتاجر"
      description="إدارة المتاجر وأصحابها والاشتراكات"
      actions={
        <>
          {" "}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onRefresh}
            className="bg-white text-ink-soft hover:border-brand hover:text-ink hover:bg-transparent"
          >
            تحديث
          </Button>{" "}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAdd}
            className="hover:bg-brand-dark"
          >
            + إضافة متجر
          </Button>{" "}
        </>
      }
    />
  );
}
