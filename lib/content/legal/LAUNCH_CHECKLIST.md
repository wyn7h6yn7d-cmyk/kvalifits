# Kvalifits — commercial launch legal checklist (internal)

Fill `LAUNCH_OPERATOR` in `lib/content/legal/placeholders.ts` only with **real** data. Public pages read those fields; unresolved items stay `null` and the site uses pre-launch wording instead of fake identity.

Do not invent registry codes, VAT numbers, addresses, or company contacts.

## Before commercial launch

- [ ] **Legal entity** — register the company (name as it will appear, e.g. Kvalifits OÜ) and set `legalEntityName`
- [ ] **Registry code** — Estonian Äriregister code → `registryCode`
- [ ] **Legal address** — registered office → `legalAddress`
- [ ] **Official contact** — monitored company email (and phone if you will publish it) → `officialEmail`, optional `phone`; confirm `contactFormMailto` mailbox
- [ ] **VAT status** — KMKR number if registered, otherwise decide public wording with counsel → `vatNumber` or leave `null`
- [ ] **Payment terms** — final prices, invoicing, when charges start; replace “planned price” copy; still no checkout until this is done
- [ ] **Final legal review** — privacy, terms, cookies, data-subject rights, and company/contact pages reviewed by counsel after operator fields are filled

## After filling fields

Public legal copy switches automatically once `legalEntityName`, `registryCode`, and `legalAddress` are all set. Then:

- [ ] Privacy email if different from official contact → `privacyEmail`
- [ ] Update planned-pricing strings in `messages/et.json`, `en.json`, `ru.json` if prices or payment terms change
- [ ] Confirm `EMAIL_FROM` / transactional mailboxes match the published contact
