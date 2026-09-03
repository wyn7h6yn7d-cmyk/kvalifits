# Human Premium photography brief

Kvalifits public photos must feel documentary and human — real people in real jobs.

**Canonical rules:** [`docs/design-guidelines.md`](../../docs/design-guidelines.md) → **HUMAN IMAGE RULES**.

## HUMAN IMAGE RULES

1. Never use AI-generated people.
2. Prefer real documentary-style workplace photography.
3. Avoid generic corporate stock photography.
4. Avoid handshake photos.
5. Avoid exaggerated smiles / thumbs-up.
6. Avoid staged “person with laptop” scenes.
7. Show different ages, jobs and environments.
8. Prefer natural expressions and real work situations.
9. Photos must support the content, not decorate empty space.
10. If no good photo exists, use no photo rather than a bad stock photo.

### Prefer (summary)

- Real workplaces, natural light, person mid-task
- Natural expressions and real emotion
- Mixed ages (not only model-looking ~25y)
- Diverse occupations listed below

### Occupations to show over time

1. Electrician / technician
2. Builder / carpenter
3. Production worker
4. Warehouse / logistics
5. Service worker
6. Hair / beauty professional
7. Healthcare worker
8. Office worker
9. IT specialist

## How to add a photo

1. Confirm the image passes **HUMAN IMAGE RULES** above.
2. Drop a licensed file into `public/marketing/` using the path in the slot table.
3. In `lib/site/marketingPhotos.ts`, set that slot `status` to `"filled"` and add `credit` + `sourceUrl`.
4. Do **not** generate missing photos with AI. If nothing good exists, leave the slot `needed` and show no photo.

Source of truth for slots: `lib/site/marketingPhotos.ts` (`MARKETING_PHOTO_SLOTS`).

## Slot status

| Slot ID | File | Occupation target | Status | Brief |
|---|---|---|---|---|
| `heroPerson` | `hero-person.jpg` | Builder / carpenter | **filled** — Ali Mkumbwa / Unsplash | Person mid-work in a real workshop, natural smile/focus |
| `realLife` | `real-life.jpg` | Electrician / technician | **filled** — Unsplash | Tradesperson mid-task with real tools and focus |
| `landingSeeker` | `landing-seeker.jpg` | Electrician / technician | **filled** — Unsplash (same source as realLife) | Tradesperson mid-task with real tools and focus |
| `landingEmployer` | `landing-employer.jpg` | Office worker | **filled** — Unsplash (same source as audienceEmployer) | Calm manager portrait in workplace light |
| `audienceSeeker` | `audience-seeker.jpg` | Service worker | **filled** — Unsplash | Café worker, natural smile at work |
| `audienceEmployer` | `audience-employer.jpg` | Office / hiring lead | **filled** — Unsplash | Calm manager portrait in workplace light |
| `benefitsWorkspace` | `benefits-workspace.jpg` | Production worker | **needed** | Workplace frame; hands/tools tell the story |
| `finalCtaPeople` | `final-cta-people.jpg` | Service worker | **needed** | Quiet confidence after work done well |

## Licence note

Hero photo currently uses Unsplash License:
https://unsplash.com/photos/a-man-smiles-as-he-works-on-a-piece-of-wood-PxlKOcj0a3Q

## Testimonials / success stories

- Components: `TestimonialCard`, `HomepageTestimonialsSection`
- Catalog: `lib/testimonials/catalog.ts` (empty until real approved stories exist)
- Guards: `HOME_TESTIMONIALS_ENABLED` + `approved: true` + photo file under `public/marketing/testimonials/`
- Production never invents names or quotes; empty catalog ⇒ section does not render
