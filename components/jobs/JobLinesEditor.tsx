"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JOB_CONTENT_LINE_MAX, JOB_CONTENT_LINES_MAX } from "@/lib/jobs/jobContentLines";

type Props = {
  title: string;
  help: string;
  addLabel: string;
  addFirstLabel: string;
  placeholder: string;
  itemLabel: (n: number) => string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export function JobLinesEditor({
  title,
  help,
  addLabel,
  addFirstLabel,
  placeholder,
  itemLabel,
  value,
  onChange,
  disabled,
}: Props) {
  const t = useTranslations("jobs");

  function updateAt(index: number, text: string) {
    onChange(value.map((row, i) => (i === index ? text : row)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addRow() {
    if (value.length >= JOB_CONTENT_LINES_MAX) return;
    onChange([...value, ""]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{title}</label>
          <p className="mt-1 text-xs leading-relaxed text-muted-2">{help}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= JOB_CONTENT_LINES_MAX}
          onClick={addRow}
          className="shrink-0 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {addLabel}
        </Button>
      </div>

      {value.length ? (
        <ul className="list-none space-y-2.5 p-0">
          {value.map((row, index) => (
            <li
              key={`line-${index}`}
              className="flex items-start gap-2 rounded-2xl border border-border bg-white p-3"
            >
              <Input
                value={row}
                disabled={disabled}
                maxLength={JOB_CONTENT_LINE_MAX}
                onChange={(e) => updateAt(index, e.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1"
                aria-label={itemLabel(index + 1)}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeAt(index)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-2 transition-colors hover:border-[rgba(37,99,235,0.24)] hover:bg-[#f5f7fb] hover:text-foreground disabled:opacity-35"
                aria-label={t("jobContentLineRemove")}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={addRow}
          className="w-full rounded-2xl border border-dashed border-border bg-white/[0.01] px-4 py-6 text-center text-sm text-muted-2 transition-colors hover:border-[rgba(37,99,235,0.26)] hover:bg-[#f5f7fb] hover:text-foreground/70"
        >
          {addFirstLabel}
        </button>
      )}
    </div>
  );
}
