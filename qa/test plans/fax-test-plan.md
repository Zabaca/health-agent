# QA Test Plan — Fax Feature

Faxing is cross-cutting: admins and agents **send** releases outbound to providers; incoming faxes are received via webhook and surface in patient records. This plan covers both directions plus the confirmation callback.

**Integration:** Faxage (third-party) via `https://api.faxage.com/httpsfax.php`
**Required env:** `FAXAGE_USERNAME`, `FAXAGE_PASSWORD`, `FAXAGE_WEBHOOK_SECRET`, R2 credentials

---

## Setup

- [ ] Faxage sandbox/test account active
- [ ] `FAXAGE_WEBHOOK_SECRET` matches the value configured on Faxage side
- [ ] A test fax number reachable from Faxage (for incoming)
- [ ] R2 bucket reachable and writable
- [ ] At least one release with signature ready to fax
- [ ] At least one provider with a valid fax number saved

---

## 1. Outgoing Fax (Send Release to Provider)

**Trigger:** Admin or agent viewing a release detail page clicks "Fax to provider".

- [ ] Fax button visible on:
  - `/admin/patients/[id]/releases/[releaseId]`
  - `/agent/patients/[id]/releases/[releaseId]`
  - PDA `/representing/[patientId]/releases/[releaseId]` (if editor permission)
- [ ] Provider selector lists only providers attached to that release with a fax number
- [ ] Providers without a fax number are disabled or hidden
- [ ] Submit triggers `POST /api/fax` with `faxNumber`, `fileData`, `fileName`, `releaseId`, `recipientName`
- [ ] A `releaseRequestLog` row is written with `status: 'awaiting_confirmation'` and Faxage `JOBID`
- [ ] On Faxage error, row is written with `status: 'failed'` and error text captured
- [ ] UI shows success/failure feedback immediately
- [ ] Fax log list on the release detail page updates with the new entry (provider name, sent time, status, JOBID)
- [ ] Double-click / rapid re-submission prevented (loading/disabled state)
- [ ] Voided release cannot be faxed (button disabled or action rejected)
- [ ] Unsigned release cannot be faxed

---

## 2. Incoming Fax Webhook (`POST /api/fax/incoming`)

**Trigger:** Faxage hits the webhook when a fax arrives at the configured destination number.

- [ ] Endpoint is publicly reachable (excluded from middleware auth matcher)
- [ ] Missing or wrong `?secret=` query param → 401/403 rejection; no DB writes
- [ ] Valid secret → payload accepted
- [ ] `incomingFaxLog` row inserted with the following metadata from Faxage:
  - `recvid` — receive ID (primary correlation)
  - `recvdate`, `starttime`
  - `cid` — caller ID
  - `dnis` — destination number
  - `pagecount`
  - `tsid` — transmit station ID
- [ ] Webhook calls Faxage `getfax` to retrieve PDF bytes
- [ ] PDF uploaded to R2 under a deterministic key
- [ ] `incomingFiles` row created with `patientId = null` (unassigned queue) and link to R2 file
- [ ] Retrying the same `recvid` does NOT create duplicate rows (idempotent on `recvid`)
- [ ] Fax metadata (CID, DNIS, TSID, page count) is persisted and retrievable
- [ ] Invalid/missing file from Faxage (getfax fails) → `incomingFaxLog` marked as error; no `incomingFiles` row created

---

## 3. Fax Confirmation Webhook (`POST /api/fax/confirm`)

**Trigger:** Faxage confirms delivery status of an outbound fax via this webhook.

- [ ] Endpoint is publicly reachable (excluded from middleware auth matcher)
- [ ] Missing/wrong `?secret=` → 401/403
- [ ] Valid payload → `faxConfirm` audit row inserted
- [ ] Related `releaseRequestLog` row (matched by `jobid`/`commid`) updates `status` to Faxage `shortstatus` (`success` / `failed`)
- [ ] Confirmation visible in release detail fax log (status changes from "awaiting confirmation")
- [ ] Fields captured: `jobid`, `commid`, `destname`, `destnum`, `shortstatus`, `longstatus`, `sendtime`, `completetime`
- [ ] Webhook is idempotent (receiving same jobid confirmation twice doesn't corrupt state)
- [ ] Unknown `jobid` (no matching log row) → still writes `faxConfirm` for audit, does not error

---

## 4. Viewing Incoming Faxes

### As Patient (`/my-records`)

- [ ] Records include both manual uploads and incoming faxes
- [ ] Fax source clearly indicated (vs manual upload)
- [ ] Fax metadata visible on record detail (received date, page count, caller ID if non-sensitive)
- [ ] TIFF files render inline via UTIF decoder (multi-page navigation)
- [ ] PDF files open in modal iframe with native browser viewer
- [ ] Large (20MB+) files load gracefully or show a limit message

### As Admin (`/admin/records`)

- [ ] All received faxes visible across all patients
- [ ] Unassigned faxes (no patientId yet) visible in a dedicated filter/view
- [ ] Can assign an unassigned fax to a patient

### As Agent (`/agent/records`)

- [ ] Unassigned fax queue visible
- [ ] Can assign to one of agent's assigned patients
- [ ] Cannot assign to unrelated patients

---

## 5. Fax File Format Support (DocViewer / DocModal)

Applies to both uploaded docs AND incoming faxes:

- [ ] **PDF** — renders in iframe; download button works
- [ ] **TIFF (single-page)** — renders as inline thumbnail; modal opens full size
- [ ] **TIFF (multi-page)** — page navigation (prev/next), page counter, zoom controls all work
- [ ] **JPG/PNG/GIF/WebP** — inline thumbnails; modal has zoom (0.25x–4x), drag-to-pan, fit-to-width
- [ ] **Corrupted or unsupported file** — graceful error message, no blank/white screen

---

## 6. Release Request Log (Audit Trail)

Viewable on release detail pages:

- [ ] Timestamp of each fax attempt (local time zone shown)
- [ ] Recipient name and destination fax number
- [ ] Status with color: green (success), yellow (awaiting confirmation), red (failed)
- [ ] Error messages on failed rows
- [ ] JOBID shown for support/debug purposes
- [ ] Log is read-only (no delete/edit)

---

## 7. Negative / Edge Cases

- [ ] Fax to a number with invalid format (letters, wrong length) → client-side or server-side rejection; no Faxage call
- [ ] Faxage API down / timeout → user-facing error; row logged as failed with error detail
- [ ] Network drops mid-webhook — retry by Faxage should be idempotent (guard on `recvid` for incoming, `jobid` for confirmation)
- [ ] R2 upload fails during incoming fax ingestion → `incomingFaxLog` marked failed; no ghost `incomingFiles` row
- [ ] Very large incoming PDF (hundreds of pages) — no crash; pagination or lazy load acceptable
- [ ] Webhook secret rotated → update both Faxage dashboard and env var; old secret stops working immediately

---

## 8. Manual End-to-End Sanity

1. Admin creates a release for a test patient, adds a signature.
2. From the release detail, fax to an internal/test number.
3. Faxage sends the fax, posts a confirmation to `/api/fax/confirm`.
4. Release detail fax log updates from "awaiting" → "success".
5. Send a fax to the test incoming number — Faxage hits `/api/fax/incoming`.
6. Log into admin/agent and assign the unassigned fax to the test patient.
7. Log into patient view and verify the fax appears in `/my-records` with correct metadata.
