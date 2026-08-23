"use client";

import { useCallback, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactPageContent } from "@/lib/content/legal";
import { SITE_CARD_PADDING, SITE_CARD_SURFACE, SITE_CONTROL_HEIGHT } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function ContactForm({
  form,
  mailTo,
  className,
}: {
  form: ContactPageContent["form"];
  /** Mailbox from legal placeholders (not shown as registered-company identity). */
  mailTo: string;
  className?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const submit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const body = [
        `Nimi / Name: ${name}`,
        `E-post / Email: ${email}`,
        "",
        message,
      ].join("\n");
      const href = `mailto:${encodeURIComponent(mailTo)}?subject=${encodeURIComponent(subject || "Kvalifits — kontakt")}&body=${encodeURIComponent(body)}`;
      setHint(form.successNote);
      window.location.href = href;
    },
    [email, form.successNote, mailTo, message, name, subject]
  );

  return (
    <form
      onSubmit={submit}
      className={cn(
        SITE_CARD_SURFACE,
        SITE_CARD_PADDING,
        "flex min-h-0 flex-col border-white/[0.10] bg-white/[0.03]",
        className,
      )}
    >
      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 content-start gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="text-xs font-medium text-white/50">{form.nameLabel}</span>
          <Input
            className="mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-xs font-medium text-white/50">{form.emailLabel}</span>
          <Input
            type="email"
            className="mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-white/50">{form.subjectLabel}</span>
          <Input
            className="mt-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-white/50">{form.messageLabel}</span>
          <textarea
            className="mt-2 min-h-[140px] w-full resize-y rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
      </div>
      <div className="mt-auto shrink-0">
        <p className="mt-4 text-xs leading-relaxed text-white/40">{form.privacyHint}</p>
        <Button
          type="submit"
          variant="primary"
          className={cn(SITE_CONTROL_HEIGHT, "mt-6 w-full rounded-2xl px-8 sm:w-auto")}
        >
          {form.submitLabel}
        </Button>
        {hint ? <p className="mt-3 text-xs text-white/50">{hint}</p> : null}
      </div>
    </form>
  );
}
