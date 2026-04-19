"use client";

import { useEffect } from "react";

function asElement(n: Node | null): Element | null {
  if (!n) return null;
  return n.nodeType === Node.ELEMENT_NODE ? (n as Element) : n.parentElement;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Word (and some rich-text consumers) paste HTML from the clipboard with
 * ancestor backgrounds and gradient/clip-text spans as dark “highlight” blocks.
 * We replace clipboard payload with plain text + minimal HTML (no backgrounds).
 */
export function ClipboardPlainCopy() {
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
        return;
      }
      if (t instanceof HTMLElement && t.isContentEditable) {
        return;
      }

      const sel = window.getSelection();
      if (!sel?.rangeCount) return;
      const text = sel.toString();
      if (!text.trim()) return;

      const a = asElement(sel.anchorNode);
      const b = asElement(sel.focusNode);
      if (a?.closest("pre, code") || b?.closest("pre, code")) return;
      if (a?.closest("input,textarea,select,[contenteditable='true']") || b?.closest("input,textarea,select,[contenteditable='true']"))
        return;

      const dt = e.clipboardData;
      if (!dt) return;

      const plain = text;
      const htmlBody = escapeHtml(plain).replace(/\r\n|\r|\n/g, "<br/>");
      dt.setData("text/plain", plain);
      dt.setData(
        "text/html",
        `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><p style="margin:0">${htmlBody}</p></body></html>`,
      );
      e.preventDefault();
    };

    document.addEventListener("copy", onCopy, true);
    return () => document.removeEventListener("copy", onCopy, true);
  }, []);

  return null;
}
