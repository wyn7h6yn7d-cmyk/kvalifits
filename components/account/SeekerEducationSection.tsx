"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { errorMessageFromUnknown } from "@/lib/utils";
import {
  EDUCATION_LEVELS,
  EDUCATION_MAX_ROWS,
  canAddEducationRow,
  educationPeriodLabel,
  sortEducationRows,
  validateSeekerEducationInput,
  type EducationLevel,
  type SeekerEducationRow,
} from "@/lib/seeker/education";

const EMPTY_FORM = {
  institution: "",
  field_of_study: "",
  degree_or_level: "" as EducationLevel | "",
  start_year: "",
  end_year: "",
  currently_studying: false,
  description: "",
};

type FormState = typeof EMPTY_FORM;

function rowToForm(row: SeekerEducationRow): FormState {
  return {
    institution: row.institution,
    field_of_study: row.field_of_study ?? "",
    degree_or_level: row.degree_or_level,
    start_year: String(row.start_year),
    end_year: row.end_year == null ? "" : String(row.end_year),
    currently_studying: row.currently_studying,
    description: row.description ?? "",
  };
}

export function SeekerEducationSection({
  seekerUserId,
  initialRows,
}: {
  seekerUserId: string;
  initialRows: SeekerEducationRow[];
}) {
  const t = useTranslations("education");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState(() => sortEducationRows(initialRows));
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    if (!canAddEducationRow(rows.length)) {
      setError(t("tooMany"));
      return;
    }
    setError(null);
    setForm(EMPTY_FORM);
    setEditingId("new");
  }

  function startEdit(row: SeekerEducationRow) {
    setError(null);
    setForm(rowToForm(row));
    setEditingId(row.id);
  }

  function cancel() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const parsed = validateSeekerEducationInput(form);
      if (!parsed.ok) {
        setError(t(`error.${parsed.error}`));
        return;
      }
      if (editingId === "new") {
        if (!canAddEducationRow(rows.length)) {
          setError(t("tooMany"));
          return;
        }
        const { data, error: insErr } = await supabase
          .from("seeker_education")
          .insert({
            seeker_user_id: seekerUserId,
            ...parsed.value,
          })
          .select(
            "id,seeker_user_id,institution,field_of_study,degree_or_level,start_year,end_year,currently_studying,description,created_at,updated_at",
          )
          .single();
        if (insErr) throw insErr;
        if (data) setRows((prev) => sortEducationRows([...prev, data as SeekerEducationRow]));
      } else if (editingId) {
        const { data, error: updErr } = await supabase
          .from("seeker_education")
          .update(parsed.value)
          .eq("id", editingId)
          .eq("seeker_user_id", seekerUserId)
          .select(
            "id,seeker_user_id,institution,field_of_study,degree_or_level,start_year,end_year,currently_studying,description,created_at,updated_at",
          )
          .single();
        if (updErr) throw updErr;
        if (data) {
          setRows((prev) =>
            sortEducationRows(prev.map((r) => (r.id === editingId ? (data as SeekerEducationRow) : r))),
          );
        }
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(errorMessageFromUnknown(e, t("saveFailed")));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusy(true);
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from("seeker_education")
        .delete()
        .eq("id", id)
        .eq("seeker_user_id", seekerUserId);
      if (delErr) throw delErr;
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) cancel();
    } catch (e) {
      setError(errorMessageFromUnknown(e, t("saveFailed")));
    } finally {
      setBusy(false);
    }
  }

  const showForm = editingId != null;

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground/80">{t("title")}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("hint")}</p>
        </div>
        {!showForm ? (
          <Button type="button" variant="outline" size="sm" onClick={startAdd} disabled={busy || rows.length >= EDUCATION_MAX_ROWS}>
            {t("add")}
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-border bg-[#f8fafc] px-3 py-2 text-sm text-muted">{error}</div>
      ) : null}

      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{row.institution}</div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    {t(`level.${row.degree_or_level}`)}
                    {row.field_of_study ? ` · ${row.field_of_study}` : ""}
                    {` · ${educationPeriodLabel(row)}`}
                    {row.currently_studying ? ` · ${t("currentlyStudying")}` : ""}
                  </div>
                  {row.description ? <p className="mt-1 text-[13px] leading-relaxed text-muted-2">{row.description}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-[13px]" disabled={busy} onClick={() => startEdit(row)}>
                    {t("edit")}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-[13px]" disabled={busy} onClick={() => void remove(row.id)}>
                    {t("delete")}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : !showForm ? (
        <p className="text-sm text-muted-2">{t("empty")}</p>
      ) : null}

      {showForm ? (
        <div
          className="grid gap-3 sm:grid-cols-2"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (e.target instanceof HTMLTextAreaElement) return;
            e.preventDefault();
            void save();
          }}
        >
          <label className="block sm:col-span-2">
            <span className="text-[12px] font-medium text-muted-2">{t("institution")}</span>
            <Input
              className="mt-1.5 h-10 rounded-xl"
              value={form.institution}
              maxLength={120}
              onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-muted-2">{t("field")}</span>
            <Input
              className="mt-1.5 h-10 rounded-xl"
              value={form.field_of_study}
              maxLength={120}
              onChange={(e) => setForm((prev) => ({ ...prev, field_of_study: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-muted-2">{t("degree")}</span>
            <select
              value={form.degree_or_level}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, degree_or_level: e.target.value as EducationLevel | "" }))
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-border bg-[#f8fafc] px-3 text-[13px] text-foreground/80 outline-none"
            >
              <option value="">{t("degreePlaceholder")}</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {t(`level.${level}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-muted-2">{t("startYear")}</span>
            <Input
              className="mt-1.5 h-10 rounded-xl"
              inputMode="numeric"
              value={form.start_year}
              onChange={(e) => setForm((prev) => ({ ...prev, start_year: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-muted-2">{t("endYear")}</span>
            <Input
              className="mt-1.5 h-10 rounded-xl"
              inputMode="numeric"
              value={form.end_year}
              disabled={form.currently_studying}
              onChange={(e) => setForm((prev) => ({ ...prev, end_year: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2 text-[13px] text-body">
            <input
              type="checkbox"
              checked={form.currently_studying}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  currently_studying: e.target.checked,
                  end_year: e.target.checked ? "" : prev.end_year,
                }))
              }
              className="accent-white"
            />
            {t("currentlyStudying")}
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[12px] font-medium text-muted-2">{t("description")}</span>
            <textarea
              value={form.description}
              maxLength={400}
              rows={2}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border bg-[#f8fafc] px-3 py-2 text-[13px] text-foreground/80 outline-none"
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button type="button" size="sm" loading={busy} onClick={() => void save()}>
              {t("save")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
