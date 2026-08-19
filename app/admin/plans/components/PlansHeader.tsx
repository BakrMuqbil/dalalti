"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
type Props = { onRefresh: () => void; onAdd: () => void };
export function PlansHeader({ onRefresh, onAdd }: Props) {
  return (
    <PageHeader
      label="DALALTI · ADMIN"
      title="إدارة الباقات"
      description="تعديل الأسعار والفترات وإنشاء باقات جديدة"
      actions={
        <>
          {" "}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAdd}
            className="hover:bg-brand-dark"
          >
            + باقة جديدة
          </Button>{" "}
        </>
      }
    />
  );
}
