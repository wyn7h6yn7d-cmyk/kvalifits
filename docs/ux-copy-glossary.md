# Kvalifits UX copy glossary

Canonical product language for Estonian (source), English and Russian.
Use these terms in UI, emails and future copy. Do not invent synonyms for the same concept.

| CONCEPT | ESTONIAN | ENGLISH | RUSSIAN | NOTES |
|---|---|---|---|---|
| job (role / occupation) | amet | job / role | должность | Use for the occupation itself, not the listing. |
| job posting | tööpakkumine | job | вакансия | Default public term. Never mix with *töökuulutus*, *töökoht* or *positsioon* in user-facing copy. |
| job seeker | tööotsija | job seeker | соискатель | |
| employer | tööandja | employer | работодатель | Public nav: *Tööandjale* / *For employers* / *Работодателю*. |
| candidate | kandidaat | candidate | кандидат | Employer-facing. Job seekers do not see this label about themselves. |
| application | kandideerimine | application | отклик | Verb: *kandideeri* / *apply* / *откликнуться*. Avoid *avaldus* in seeker UI except where historically stored. |
| match | sobivus | match | соответствие | Never *match score*, *sobivusskoor* or *facet* in UI. |
| match percentage | sobivus (%) | match (%) | соответствие (%) | Format: `87% sobivus` / `87% match` / `соответствие 87%`. |
| skill | oskus | skill | навык | |
| certificate | sertifikaat | certificate | сертификат | Combined UI label below. |
| certifications & licences | sertifikaadid ja load | certifications & licences | сертификаты и допуски | Filters, job detail, job form. Nav may shorten to *Sertifikaadid*. |
| verified (status) | kontrollitud | verified | проверено | One status word only. Brand phrase: *kontrollitud oskused*. Avoid *verifitseeritud* in UI. |
| submitted (cert) | esitatud | submitted | отправлено | Certificate verification queue. |
| under review (cert) | kontrollimisel | under review | на проверке | |
| rejected (cert) | tagasi lükatud | rejected | отклонено | |
| expired (cert) | aegunud | expired | истек срок | |
| requirement | nõue | requirement / criterion | требование | |
| required requirement | kohustuslik nõue | required qualification | обязательное требование | Job detail heading: *Kohustuslikud nõuded*. |
| preferred requirement | soovituslik nõue | preferred qualification | желательное требование | Job detail heading: *Soovituslikud nõuded*. |
| salary | palk | salary | зарплата | Cards: `2300–2700 € bruto / kuu`. |
| workload | töökoormus | workload | занятость | Values: täistööaeg / osaline tööaeg / tähtajaline / praktika (`job_type`). |
| work arrangement | töö tegemise koht | work arrangement | формат работы | Values: kohapeal / hübriid / kaugtöö (`work_type`). Do **not** call this *töövorm* if workload uses a different field. |
| experience | töökogemus | experience | опыт работы | |
| location | asukoht | location | местоположение | |
| saved job | salvestatud tööpakkumine | saved job | сохранённая вакансия | Nav short: *Salvestatud* / *Saved* / *Сохранённые*. |
| notification | teavitus | notification | уведомление | |
| interview | vestlus | interview | собеседование | Apply options: Kohapeal, Microsoft Teams, Telefon, Videokõne, Kõik sobivad. |
| profile | profiil | profile | профиль | |
| company | ettevõte | company | компания | |
| publish | avalda | publish | опубликовать | CTA: *Avalda tööpakkumine*. |
| draft | mustand | draft | черновик | |
| expired (job) | aegunud | expired | истек срок | Inactive listing; not deleted. |
| full-time | täistööaeg | full-time | полная занятость | |
| part-time | osaline tööaeg | part-time | частичная занятость | |
| fixed-term / contract | tähtajaline | fixed-term | срочный договор | Maps to `job_type: contract`. |
| internship | praktika | internship | стажировка | |
| on-site | kohapeal | on-site | на месте | |
| hybrid | hübriid | hybrid | гибридный формат | |
| remote | kaugtöö | remote | удалённая работа | |
| industry / field | valdkond | industry | отрасль | Filter facet. |
| search | otsi | search | искать | Button: *Otsi*. Page: *Otsi tööpakkumisi*. |

## Application statuses

### Employer (internal)

| Status key | ESTONIAN | ENGLISH | RUSSIAN |
|---|---|---|---|
| new | Uus | New | Новый |
| reviewing | Ülevaatamisel | Reviewing | На рассмотрении |
| interview | Vestlusele | Interview | Собеседование |
| interview_2 | Teine vestlus | Second interview | Второе собеседование |
| offer | Pakkumine tehtud | Offer made | Предложение сделано |
| hired | Palgatud | Hired | Нанят |
| rejected | Ei sobinud | Not a fit | Не подошёл |
| withdrawn | Kandidaat loobus | Candidate withdrew | Кандидат отказался |

### Job seeker (external)

| Status key | ESTONIAN | ENGLISH | RUSSIAN |
|---|---|---|---|
| submitted / new | Kandideerimine saadetud | Application sent | Отклик отправлен |
| reviewing | Tööandja vaatab kandideerimist | Employer is reviewing | Работодатель рассматривает отклик |
| interview / interview_2 | Kutsutud vestlusele | Invited to interview | Приглашение на собеседование |
| offer | Pakkumine tehtud | Offer made | Предложение сделано |
| hired | Valituks osutunud | Selected | Выбраны |
| rejected / withdrawn | Värbamisprotsess lõppenud | Process ended | Процесс найма завершён |

Do not show employer pipeline labels or internal notes to job seekers.

## Standard actions

| Action | ESTONIAN | ENGLISH | RUSSIAN |
|---|---|---|---|
| search | Otsi | Search | Искать |
| apply | Kandideeri | Apply | Откликнуться |
| save | Salvesta | Save | Сохранить |
| edit | Muuda | Edit | Изменить |
| add | Lisa | Add | Добавить |
| delete | Kustuta | Delete | Удалить |
| continue | Jätka | Continue | Продолжить |
| back | Tagasi | Back | Назад |
| publish | Avalda | Publish | Опубликовать |
| send | Saada | Send | Отправить |
| confirm | Kinnita | Confirm | Подтвердить |
| cancel | Tühista | Cancel | Отмена |
| close | Sulge | Close | Закрыть |
| view | Vaata | View | Смотреть |

## Brand slogans (use sparingly)

Keep a small set. Do not invent a new slogan per section.

**Job seekers**

- ET: Leia töö, mis sobib sinu oskustega.
- EN: Find jobs that match your skills.
- RU: Найдите работу, которая соответствует вашим навыкам.

- ET: Näe, miks töö sulle sobib.
- EN: See why a job is a match.
- RU: Смотрите, почему вакансия вам подходит.

**Employers**

- ET: Leia kandidaadid, kes vastavad sinu nõuetele.
- EN: Find candidates who meet your requirements.
- RU: Находите кандидатов, которые соответствуют вашим требованиям.

## Fields that must stay distinct

| Data field | UI label | Values |
|---|---|---|
| `job_type` | Töökoormus / Workload / Занятость | full_time, part_time, contract, internship |
| `work_type` | Töö tegemise koht / Work arrangement / Формат работы | on_site, hybrid, remote |

`job_type` currently mixes hours and contract type. Until the data model splits them, keep one facet label (*Töökoormus*) and honest value labels (*Tähtajaline*, *Praktika*).
