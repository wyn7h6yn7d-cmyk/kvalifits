"use client";

import { useCallback, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactPageContent } from "@/lib/content/legal";
import { cn } from "@/lib/utils";

export function ContactForm({
  form,
  mailTo,
  className,
}: {
  form: ContactPageContent["form"];
  /** Tavaliselt üldkontakt; asenda placeholder päris aadressiga. */
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
      className={cn("rounded-2xl border border-white/[0.10] bg-white/[0.03] p-6 sm:p-8", className)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
            className="mt-2 min-h-[140px] w-full resize-y rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/40">{form.privacyHint}</p>
      <Button type="submit" variant="primary" size="lg" className="mt-6 h-12 rounded-2xl px-8">
        {form.submitLabel}
      </Button>
      {hint ? <p className="mt-3 text-xs text-white/50">{hint}</p> : null}
    </form>
  );
}
