# Storage & Upload Production Hardening

Date: 2026-08-19

## Verdict

**PASS** (MIME, size, RLS, signed URLs)  
**NOT APPLICABLE** — malware scanning not implemented (documented gap)

---

## Bucket policy summary (remote verified)

| Bucket | Public | Purpose |
|--------|--------|---------|
| `resumes` | No | Private CVs |
| `certificates` | No | Private certificate documents |
| `cvs` | No | Legacy private CV path |
| `avatars` | Yes | Profile + employer logos (in-app paths) |
| `company-logos` | Yes | Public logos |
| `certificate-images` | Yes | Thumbnails only when intentionally public |

---

## Server enforcement (Supabase storage)

| Asset | MIME allow-list | Max size |
|-------|-----------------|----------|
| Resumes | PDF | 10 MiB — `20260818140000_private_cv_resumes_storage.sql` |
| Certificates | JPEG, PNG, WebP, GIF, PDF | 10 MiB — `2026081600007_*` |
| Avatars/logos | JPEG, PNG, WebP, GIF, PDF | 10 MiB — `2026081600006_*` |

RLS: owner-path prefixes `{user_id}/…`; cross-user download denied (93/0 security suite).

---

## Application layer

| Control | Location |
|---------|----------|
| Client PDF cap 8 MiB | `lib/seeker/cvUpload.ts`, forms |
| Image resize before upload | `lib/uploads/prepareUploadFile.ts` |
| Safe path generation | User UUID prefix; no user-controlled bucket paths |
| Signed URL routes | `/api/resumes/signed-url`, `/api/certificates/signed-url` — auth + consent checks |

Do not trust client MIME alone — storage policies enforce on upload.

---

## Gaps

| Gap | Risk | Recommendation |
|-----|------|----------------|
| No antivirus/malware scan | Low–medium for PDF/image payloads | Future: ClamAV lambda or storage webhook scan before employer download |
| Client CV 8 MiB vs server 10 MiB | Low | Align caps or document intentional buffer |
| Certificate images without client byte cap | Low | Resize reduces risk; server cap applies |

---

## Public launch minimum

**Met:** strict MIME, size limits, private buckets for CV/certs, signed URL access, RLS tests passing.

Malware scanning is **future architecture**, not claimed in product.
