# VEEW OS — Frontend Migration Brief

Hand this document to the agent building the new frontend. Rebuild **product behavior, screens, and API usage** from this spec. Do **not** copy the current React/Vite/Tailwind stack unless it happens to match the new repo. The current app is the source of truth for **what the product does**, not for **how it is implemented**.

This brief covers **frontend only**. A separate backend is being built in another repository. Treat the API contract in this document as the interface the new frontend must speak. If the new backend changes a path or payload, update the client to match that backend — but keep the same user-facing product.

---

## 1. Mission

**VEEW OS** is an internal operations app for **Vinayaka Electricals and Engineering Works (VEEW)**, Chitradurga, Karnataka.

The product tracks **electricity meter installation jobs** end to end:

1. Capture a customer and their property.
2. Start a project (the “work”).
3. Move that work through a fixed **7-stage ESCOM workflow**.
4. Record money in and out against each project (agreed total vs paid vs remaining).
5. Generate the official lighting-file PDF for a customer.

The operator is typically in the field or at a desk on a **phone**. The UI is **mobile-first**, with a desktop sidebar for larger screens.

**Product name in UI:** VEEW OS  
**Page title:** `Vinayaka Electricals — VEEW OS`  
**Version footer:** `VEEW OS v1.0 · Meter Installation Module`

---

## 2. What to rebuild vs what to leave out

### Rebuild (required)

- Password login and session restore.
- Authenticated shell (sidebar + mobile bottom nav + sticky header).
- Home / dashboard.
- Customers: list, create (with first project), detail, edit, delete.
- Projects / Work Queue: list, create, detail, edit.
- 7-stage workflow updates, including auto-advance and completion.
- Payments: global ledger + per-project recording.
- Reports with four tabs (Overview, Work, Payments, Customers).
- Search across customers, properties, and projects.
- Settings: profile, company, password, logout.
- Lighting-form PDF download from the customer detail page.
- Currency in INR, dates in `en-IN`.
- Touch-friendly controls (minimum ~44px tap targets).

### Do not rebuild as first-class UI (legacy / unused)

These exist in the current data model or API but **have no real screens** today. Do not invent UIs for them unless the product owner later asks.

| Item | Current behavior |
|------|------------------|
| Service Requests | Data exists; `/service-requests/*` **redirects to `/projects`**. New work is created as a **Project** directly. |
| Notifications inbox | `/notifications` **redirects to Home**. Snapshot includes `notifications`, but nothing in the UI lists, badges, or marks them read. |
| Notification preference toggles | Stored on the user profile; Settings **does not** expose them. |
| Binary file storage | File inputs save **filename metadata only**. There is no upload of bytes. Show a note that binary storage is a later backend phase. |
| Kannada translation UI | Lighting PDF Kannada overlay is **server-side**. Frontend only triggers the download. |

### Do not implement backend

Do not stand up Express, JSON storage, PDF generation, auth hashing, or database code in the frontend repo. Call the new backend’s HTTP API.

---

## 3. Users and access

Single-operator app (one company user).

- Login is **password only** (no username, no email, no OTP, no social login).
- Default seed password in the current environment: `veew2026`. Do **not** hardcode this as the only accepted password in production. The current login error copy mentions it as a hint (`Invalid password. Try: veew2026`) — keep that hint only if the new backend still uses the same seed; otherwise show a generic invalid-password message.
- After login, the API returns a **JWT**. Store it (current app: `localStorage` key `veew_token`) and send `Authorization: Bearer <token>` on every authenticated request.
- On boot, if a token exists, call `GET /auth/me`. Success → stay logged in and load app data. Failure → clear token and show login.
- Unauthenticated users hitting any app route go to `/login`.
- Authenticated users hitting `/login` go to `/`.
- Unknown routes go to `/`.
- Logout clears the token and returns to login.
- There is no role system, no multi-user switcher, and no “remember me” checkbox.

---

## 4. Design system

Match the **look and density** of the current app even if you use a different CSS/UI library.

### Brand

- Company: Vinayaka Electricals and Engineering Works, Chitradurga.
- Logo image: `/logo.jpg` (used as favicon, apple-touch-icon, login mark, sidebar mark, mobile header mark, settings footer). Copy this asset into the new frontend’s public/static folder. If it is missing from the source repo, obtain it from the client.
- Font: **Inter** (400 / 500 / 600 / 700), with system-ui fallback.
- Theme color / browser chrome: `#1e3a5f`.
- Viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no` (current app disables pinch-zoom).

### Color tokens

Use a blue primary scale equivalent to Tailwind blue:

| Token | Hex |
|-------|-----|
| primary-50 | `#eff6ff` |
| primary-100 | `#dbeafe` |
| primary-500 | `#3b82f6` |
| primary-600 | `#2563eb` |
| primary-700 | `#1d4ed8` |
| accent-400 | `#fbbf24` |
| accent-500 | `#f59e0b` |

Page background: slate-50 (`#f8fafc`). Body text: slate-900. Secondary text: slate-500 / slate-600. Borders: slate-200.

Semantic colors used throughout:

- **Paid / success:** green (700/800 on 50 backgrounds).
- **Due / warning:** amber.
- **Danger / delete:** red.
- **Active work:** primary blue / purple accents on Home “Active works” tile.

### Shape and spacing

- Cards: white, `rounded-2xl` (~16px), 1px slate-200 border, light shadow.
- Buttons and inputs: `rounded-xl` (~12px).
- Pills/filters/badges: `rounded-full`.
- Login card: `rounded-[26px]`.
- Login password field and submit: **fully rounded (pill)**.
- Page padding: `16px` mobile, `24px` desktop.
- Vertical stack gap on pages: ~16–20px.
- Touch targets: **min-height 44px** on buttons, inputs, header search, nav items.

### Badge colors by status string

Render a pill badge. Unknown statuses fall back to slate.

| Status | Style |
|--------|--------|
| New | blue |
| Inspection Pending, Waiting for Inspection, Processing, On Hold | amber |
| Inspection Completed | teal |
| Fee Discussion | orange |
| Approved, Completed, Sanctioned, Received | green |
| Rejected, Correction Required | red |
| Cancelled, Pending | slate |
| Converted to Project | purple |
| Active | primary |
| In Progress, Inspection Scheduled | blue |
| Submitted | indigo |

### Layout chrome

**Desktop (≥ lg / ~1024px)**

- Sticky left sidebar, 256px wide, white, right border.
- Logo centered at top of sidebar.
- Nav items with icon + label. Active item: primary-50 background, primary-700 text.
- Bottom of sidebar: avatar circle with first letter of profile name, truncated company name, Logout (hover turns red).
- Main column has **no** bottom nav.

**Mobile (< lg)**

- No sidebar.
- Sticky header: logo (left) + page title (right-aligned) + search icon button (except nested pages with Back).
- Nested pages (create/edit/detail/search): Back button (`← Back`) on the left, title, small logo on the right. **No search icon** on those pages.
- Fixed bottom nav, 5 items: Home, Work, Customers, Pay, Reports. Active: primary-600. Inactive: slate-400. Icon + 10px label. Add bottom padding on the page (`pb-20`) so content is not hidden behind the bar.
- Settings is **desktop-nav only**. On mobile, reach Settings from… the current app only lists it in the desktop sidebar. Reproduce that: mobile users currently have no Settings tab. Include Settings in the desktop sidebar; on mobile, either keep the same limitation or add a discreet entry from the Home header — prefer matching current behavior (sidebar only) unless asked otherwise.

Desktop sidebar items (in order):

1. Home `/`
2. Customers `/customers`
3. Work Queue `/projects`
4. Payments `/payments`
5. Reports `/reports`
6. Settings `/settings`

Active state: exact match for `/`; prefix match for the others.

### Login visual (must match closely)

Full-viewport purple night scene:

- Vertical gradient: `#4e2678` → `#6d3498` → `#8f47b8` → `#7a3aa8` → `#4f2378` → `#2a1045`.
- White star dots and ✦ sparkles in the upper sky.
- Distant mountain SVG silhouettes in mid-purple.
- Dense pine-forest SVG along the bottom, dark violet/black.
- Radial vignette.
- Centered logo, then a **glass** card (`backdrop-filter` blur ~18px, white 14% fill, white 40% border, inner highlight, purple drop shadow).
- White “Login” heading.
- Password field: dark purple translucent pill, white text, lock icon on the right.
- White pill submit button, text color `#4b1d7c`.
- Error: small amber-on-dark rounded pill.

Unauthenticated splash while restoring session uses the same background + logo + “Loading...”. Authenticated splash (token present, data not ready) is a simple slate-50 page with logo + “Loading VEEW OS...”.

### Copy and locale

- UI language: **English**.
- Currency: Indian Rupees via `en-IN`, **zero fraction digits** (e.g. `₹12,500`).
- Dates: `en-IN`, `dd MMM yyyy` (e.g. `15 Jan 2026`).
- Date-times: same date plus hours and minutes.
- GPS map links: `https://maps.google.com/?q={lat},{lng}`.
- Phone links: `tel:{mobile}`.

---

## 5. Routes

Implement these exact paths so bookmarks and deep links stay stable.

| Path | Auth | Screen |
|------|------|--------|
| `/login` | public | Login |
| `/` | protected | Home / Dashboard |
| `/customers` | protected | Customer list |
| `/customers/new` | protected | New customer **and** first project |
| `/customers/:id` | protected | Customer detail |
| `/customers/:id/edit` | protected | Edit customer |
| `/projects` | protected | Work queue |
| `/projects/new` | protected | New project for an existing customer. Honors `?customerId=` |
| `/projects/:id` | protected | Project / work detail |
| `/projects/:id/edit` | protected | Edit work |
| `/payments` | protected | Payments ledger |
| `/reports` | protected | Reports |
| `/settings` | protected | Settings |
| `/search` | protected | Search |
| `/notifications` | protected | Redirect to `/` |
| `/service-requests/*` | protected | Redirect to `/projects` |
| `*` | — | Redirect to `/` |

Protected routes wrap the shell (sidebar + mobile nav). Login does not.

---

## 6. Domain model (frontend)

IDs are strings generated by the backend, typically `PREFIX-YEAR-#####` (e.g. `CUS-2026-10001`, `PRJ-2026-40001`, `PROP-…`, `PAY-…`, `DOC-…`, `CON-…`, `CN-…`). Do not generate IDs on the client.

Timestamps `createdAt` / `updatedAt` are ISO-8601. Payment `date` and some stage dates are `YYYY-MM-DD`.

### Customer

```
id, name, fatherSpouseName, mobile, village, panchayat, taluk, district,
pinCode, aadhaar, pan?, contacts[], notes[], createdAt, updatedAt
```

### Contact (nested on customer)

```
id, name, relationship, mobile, whatsapp, notes
```

Relationship options used in forms: `Son`, `Spouse`, `Brother`, `Site Contact`, `Agent`, `Other`.

### Property

```
id, customerId, type, documentNumber, documentType, latitude?, longitude?,
sitePhoto?, createdAt, updatedAt
```

- `type`: `Domestic` | `Commercial` | `Industrial` | `Agricultural`
- `documentType`: `E-Swathu` | `Khata` | `RTC` | `Building License` | `Other`

### Connection (nested on project)

```
id, type, requiredLoad, phase, remarks
```

- `type`: `Domestic` | `Commercial` | `Industrial` | `Temporary`
- `phase`: `Single` | `Three`
- Default new row: type Domestic, load `1 KW`, phase Single, empty remarks.

### Project (the work item)

```
id, serviceRequestId?, customerId, propertyId, status, currentStage,
siteClassification?, connections?, inspectionNotes?, totalAmount?,
stages, rrNumber?, rrReceivedDate?, completionDate?, closingRemarks?,
notes[], createdAt, updatedAt
```

- `status`: `Active` | `Completed` | `Cancelled` | `On Hold`
- `siteClassification`: `Rural Panchayat` | `Urban Municipality` | `Revenue Site`
- `totalAmount` is the **agreed project fee**. Optional. When missing, the UI shows “No payment target set”.
- New projects start as `status: Active`, `currentStage: Inspection`.

### Stage data (one per workflow stage)

```
status, startDate?, completionDate?, notes
```

`stages` is a map keyed by workflow stage name.

### Payment

```
id, projectId, customerId, type, amount, date, mode, referenceNumber, remarks
```

- `type`: `VEEW Service Charges` | `ESCOM Fees` | `Meter Cost` | `Customer Advance` | `Final Customer Payment` | `Other`
- `mode`: `Cash` | `UPI` | `Bank Transfer` | `Other`

### Document (metadata only)

```
id, type, fileName, uploadDate, description, customerId?, propertyId?, projectId?
```

Document `type` enum:

`Aadhaar`, `PAN`, `E-Swathu`, `Khata`, `RTC`, `Building License`, `Application`, `CR`, `Field Report`, `Estimate`, `Power Sanction`, `Work Order`, `Fee Receipt`, `Meter Purchase Receipt`, `Other`

### Project photo (metadata only)

```
id, projectId, fileName, caption, uploadDate
```

### Activity

```
id, type, description, entityType ('customer' | 'service_request' | 'project'),
entityId, createdAt
```

Shown on project detail (collapsed section). Types the current backend writes include: `Customer Created`, `Project Created`, `Payment Added`, `Document Uploaded`, `RR Number Added`, `Project Completed`, `Customer Deleted`.

### User profile (no password)

```
name, mobile, email, companyName, companyLocation,
notificationPreferences: {
  missingDocuments, pendingPayments, followUps, stageReminders, agencyInspection
}
```

Settings currently edits name, mobile, email, companyName, companyLocation only.

### Snapshot (`GET /data`)

After login, the current frontend loads **one snapshot** and derives almost everything client-side:

```
customers[], properties[], serviceRequests[], projects[], documents[],
payments[], photos[], activities[], notifications[]
```

Prefer this same pattern unless the new backend is strictly resource-oriented and has no snapshot endpoint. If you use per-resource GETs instead, you must still be able to join customers ↔ properties ↔ projects ↔ payments for every screen below.

Reload the snapshot (or the affected resources) after every successful mutation.

---

## 7. Payment math (must be identical)

All money UI uses these rules. Do not invent a different remaining-balance formula.

```
paid(project)      = sum of payment.amount where payment.projectId === project.id
agreedTotal        = project.totalAmount
hasTarget          = agreedTotal != null && agreedTotal > 0
remaining          = hasTarget ? max(agreedTotal - paid, 0) : 0
progressPercent    = hasTarget ? min(round(paid / agreedTotal * 100), 100) : 0
```

Customer-level:

```
paid(customer)     = sum of payments where payment.customerId === customer.id
agreedTotal        = sum of (project.totalAmount || 0) for that customer's projects
hasTarget          = agreedTotal > 0
remaining          = hasTarget ? max(agreedTotal - paid, 0) : 0
```

**PaymentBalanceSummary** component:

- If `!hasTarget && paid === 0` → text “No payment target set”.
- If `hasTarget` → three tiles: Total (slate), Paid (green), Remaining (amber), plus a progress bar. At 100% show “Fully paid” in green.
- If `!hasTarget && paid > 0` → single green “Paid so far” tile.

**Customer payment summaries** (Payments page): include a customer if they have any payment, any project with `totalAmount`, or paid > 0. Sort customers by total paid descending. Within a customer, sort projects by paid descending. Sort each project’s payments by date descending.

Display paid/total as `₹paid / ₹total` in green / slate. Remaining uses amber.

---

## 8. Seven-stage workflow (must be identical)

Fixed order — never reorder, never skip in the UI:

1. Inspection
2. File Preparation
3. Power Sanction
4. Work Order
5. Meter Purchase
6. Agency Inspection
7. RR Number & Closure

### Allowed statuses per stage (stage-update modal)

| Stage | Options |
|-------|---------|
| Inspection | Pending, In Progress, Completed |
| File Preparation | Pending, In Progress, Completed |
| Power Sanction | Pending, Submitted, Sanctioned, Rejected |
| Work Order | Pending, Processing, Received |
| Meter Purchase | Pending, In Progress, Completed |
| Agency Inspection | Waiting for Inspection, Inspection Scheduled, Inspection Completed, Correction Required, Approved |
| RR Number & Closure | Pending, In Progress, Completed |

### Auto-advance

When the operator saves a stage update:

1. Write the chosen status + notes onto `stages[currentStage]`.
2. If the new status is one of `Completed`, `Approved`, `Sanctioned`, `Received`, also set `completionDate` to today (`YYYY-MM-DD`).
3. If that status is in the set above **and** this is not the last stage:
   - set `currentStage` to the next stage
   - set that next stage to `{ status: 'In Progress', startDate: today }` (keep existing notes)
4. If current stage is `RR Number & Closure` **and** status is `Completed`:
   - set project `status` to `Completed`
   - set `completionDate` to today
5. If the operator typed an RR number, send `rrNumber` and `rrReceivedDate: today`. Show the RR field **only** on the RR Number & Closure stage.

A stage counts as “complete” in the stepper when its status is `Completed`, `Approved`, `Sanctioned`, or `Received`.

### Workflow stepper

Two variants:

- **Compact** (work cards): horizontal row of 7 numbered circles (6×6). Complete = green with check. Current = primary. Future = slate. Short connecting bars.
- **Full** (project detail): vertical list with 8×8 circles, labels, and the stage’s current status text. Current circle has a primary ring.

---

## 9. Client-side validation

Mirror these before submit. The API will also reject invalid payloads with `{ error: string }` (and sometimes `{ details }`). Show `error` to the user.

| Field | Rule |
|-------|------|
| Customer name | required, non-empty trim |
| Father/Spouse name | required |
| Mobile | Indian mobile: `/^[6-9]\d{9}$/` |
| Village, Panchayat, Taluk, District | required |
| PIN | `/^\d{6}$/` |
| Aadhaar | 12 digits after stripping spaces: `/^\d{12}$/` |
| PAN | optional |
| Property document number | required |
| Connection requiredLoad | required on create |
| Total amount (when provided) | number `> 0` |
| Contact name | required if that contact row is submitted |
| Contact mobile | if present, same 10-digit rule |
| New password | min length 6 |
| Profile mobile | same 10-digit rule |
| Profile email | valid email if sent |

Strip spaces from Aadhaar before sending. Default district on new customer form: `Chitradurga`.

If WhatsApp is blank on a contact, send the mobile number as WhatsApp.

---

## 10. Screen-by-screen specification

### 10.1 Login `/login`

- Fields: password only.
- Submit → `POST /auth/login` with `{ password }`.
- Success → store token, store profile, go to `/`.
- Failure → inline error.
- Button label: `Login` / `Logging in...`.
- Visual: see Design system.

### 10.2 Home `/`

Header: title `Home`, subtitle `Track work & payments`. Search icon.

**Row 1 — three large tiles (clickable):**

| Tile | Value | Goes to |
|------|-------|---------|
| Active works | count of projects with `status === 'Active'` | `/projects` |
| Balance amount | sum of remaining across **all** projects | `/payments` |
| Total received | sum of all payment amounts | `/payments` |

**Row 2 — three smaller tiles:**

| Tile | Value | Goes to |
|------|-------|---------|
| Customers | `customers.length` | `/customers` |
| Completed | count `status === 'Completed'` | `/projects` |
| Pending pay | count of **Active** projects with `hasTarget && remaining > 0` | `/payments` |

**Collection progress card** (only if any project has `totalAmount > 0`):

- Title “Collection progress”, percent on the right.
- Bar width = `min(round(totalReceived / totalAgreed * 100), 100)`.
- Caption: Received {currency} · Target {currency}.

**Active works list**

- Heading “Active works” + “View all” → `/projects`.
- Sort active projects by remaining due **descending**, then by id.
- Show first **6** as `ProjectWorkCard`.
- If more than 6, outline button: `View {n} more active works`.
- Empty: “No active projects. Add a customer to start meter installation work.” + primary button “New Customer & Project” → `/customers/new`.

### 10.3 ProjectWorkCard (shared)

Used on Home, Work Queue, and Customer detail.

- Customer name (bold).
- Current stage (primary color).
- `{village} · {project.id} · {current stage status}`.
- Status badge + chevron.
- Compact stepper (optional; **hide** on customer detail via `showStepper=false`).
- PaymentBalanceSummary (sm).
- Phone line if mobile exists (display only; the card itself navigates to the project).
- Click → `/projects/{id}`.

### 10.4 Customers list `/customers`

Header: `Customers` / `{n} total customers`.

- Search input (name, mobile, village, aadhaar) + Add button → `/customers/new`.
- Empty: EmptyState “No customers found”. If search is empty, offer Add Customer.
- Otherwise a wide table (`min-width ~760px`, horizontal scroll on small screens).

Columns: Name (with father/spouse under it), Mobile, Village, Properties count, Projects count, Amount, Actions.

Amount cell:

- If hasTarget: `paid / total` with tooltip “Remaining: …” or “Fully paid”.
- Else if paid > 0: paid in green.
- Else: em dash.

Actions (icon buttons with tooltips): View (eye, primary), Edit (pencil, amber), Delete (trash, red). Name also navigates to detail.

**Delete modal**

- Title: “Delete this customer?”
- Red warning: cannot be undone; deletes customer **and** related properties, projects, payments, and documents.
- If outstanding remaining > 0, extra amber box showing remaining / paid / total.
- Operator must type the customer name **exactly**.
- Confirm disabled until the name matches and the request is not in flight.
- Confirm button is red: `Delete customer` / `Deleting...`.
- On API error, show the message in the modal.
- `DELETE /customers/:id`.

### 10.5 New customer & project `/customers/new`

This is the **primary onboarding flow**. One form creates customer → contacts → property → document metadata → project, then navigates to the new project.

Header: `New Customer & Project` / `Step 1: Customer · Step 2: Property · Step 3: Project & payment`. Back to `/customers`.

Visual step chips (all highlighted; not a wizard): `1. Customer` `2. Property` `3. Project`.

**Section 1 — Personal details**

- Customer Name*, Father/Spouse Name*, Mobile / WhatsApp* (max 10), Village*, Panchayat*, Taluk*, District* (default Chitradurga), PIN Code* (max 6), Aadhaar Number* (max 12), PAN Number (optional).

**Customer Documents**

- Aadhaar PDF file input (`accept=".pdf,image/*"`).
- PAN Card PDF (optional), same accept.
- Store **file name only**.
- Helper: “File metadata is saved now; binary upload storage comes with the next backend phase.”

**Contacts (optional)**

- “Add Contact” adds a card: Name, Relationship/Role select, Mobile, WhatsApp, Notes, Remove.
- Skip rows that lack name or mobile at submit time.

**Section 2 — Property**

- Property Type select, Property Document Type select, Property Document Number*.
- Latitude / Longitude number inputs (placeholders `13.7963` / `76.2841`).
- Outline button “Capture Current GPS” using `navigator.geolocation.getCurrentPosition`.

**Section 3 — Project & payment**

- Site Classification select (default Rural Panchayat).
- Total Project Amount (₹), optional, helper text: “Agreed total fee for this project. Used to track paid vs remaining balance.”
- Connection Required: one row by default, “Add” for more. Each row: Type, Load*, Phase, Remarks.
- Inspection Notes textarea.

Footer: Cancel (history back) + `Save & Start Project` / `Saving...`.

**Submit sequence (order matters):**

1. `POST /customers` (aadhaar stripped, pan omitted if blank).
2. For each valid contact: `POST /customers/:id/contacts`.
3. `POST /properties`.
4. If Aadhaar file name: `POST /documents` type `Aadhaar`, customerId.
5. If PAN file name: `POST /documents` type `PAN`, customerId.
6. If property document number: `POST /documents` with type = documentType (or `Other`), fileName `{documentNumber}.pdf`, propertyId + customerId.
7. `POST /projects` with customerId, propertyId, siteClassification, connections, inspectionNotes, optional totalAmount.
8. Navigate to `/projects/{newProjectId}`.

On failure, show a form-level red banner with the error message. Do not leave the user without feedback.

### 10.6 Customer detail `/customers/:id`

Header: customer name / `{village} · {mobile}`. Back to `/customers`.

If missing: “Customer not found” + link back.

Actions, top to bottom:

1. Primary full-width **Generate document** → download lighting PDF (see API). Label `Generating document...` while in flight. Show error banner on failure.
2. Outline **Edit customer details** → `/customers/:id/edit`.
3. Call link `tel:{mobile}` styled as a bordered row.
4. Card “Overall payment” with PaymentBalanceSummary.

**Projects & work**

- Heading + small “New” → `/projects/new?customerId={id}`.
- Empty: “No projects yet” + “Start project”.
- Else: ProjectWorkCard list **without** stepper.

**Collapsible** “Customer details & documents” (chevron). When open:

- Personal details definition list: Father/Spouse, Mobile, Village, Panchayat, Taluk, District, PIN, Aadhaar, PAN (if present).
- Contacts (if any): name, relationship, mobile.
- Properties: `{type} · {documentType}` and document number.
- Documents (customer-level or property-level for this customer’s properties): type + fileName.
- All payments: type, `{date} · {projectId}`, amount.

### 10.7 Edit customer `/customers/:id/edit`

Header: `Edit Customer` / name. Back to `/customers`.

Load form from customer + their properties. Show “Loading customer...” until initialized.

Sections:

- Personal details — same fields and validation as create.
- Contacts — add/remove; replace **entire** list via `PUT /customers/:id/contacts` with `{ contacts }`. Keep existing ids when present.
- Properties — edit existing (cannot remove existing rows in the current UI) and add new ones. Existing: `PUT /properties/:id`. New: `POST /properties`. Each row: type, document type, document number*, lat, lng.
- Add documents: list existing; optional new Aadhaar/PAN file names → `POST /documents`.

Cancel → customer detail. Submit → `PUT /customers/:id` then contacts then properties then documents, then navigate to detail.

### 10.8 Work Queue `/projects`

Header: `Work Queue` / `{activeCount} active · {total} total`.

- Filter chips: All, Active, Completed, Cancelled. (On Hold is a status but **not** a chip on this screen.)
- Search: project id, customer name, RR number.
- New button → `/projects/new`.
- Empty: EmptyState + New Project.
- Else: ProjectWorkCard for each match.

### 10.9 New project `/projects/new`

Header: `Start New Project` / `Customer → Property → 7-stage workflow`. Back to `/projects`.

If `?customerId=` is present, preselect that customer.

Fields:

- Customer* (clears property when changed).
- Property* (options filtered to that customer: `{type} - {documentNumber}`). Placeholder “Select customer first” until a customer is chosen.
- Site Classification.
- Total Project Amount (optional).
- Connection Required (same as customer-create), Inspection Notes.

Submit: `POST /projects`, then go to `/projects/{id}`. Buttons: Cancel / `Start Project` / `Starting...`.

### 10.10 Project detail `/projects/:id`

Header: customer name (fallback project id) / `{currentStage} · {id}`. Back to `/projects`.

If missing: “Project not found”.

**Always visible**

1. Outline “Edit work details” → `/projects/:id/edit`.
2. Badges: project status, current stage. If `rrNumber`, green pill `RR: {rrNumber}`.
3. Two buttons: **Update stage** | **Record payment**.
4. Call customer row if mobile exists.
5. Payment status card + ghost “Edit total” / “Set total”.
6. Current stage card: stage name, stage status, notes, full WorkflowStepper.
7. Payments card: type breakdown chips, last 5 payments (type, formatted date · mode, amount), ghost “+ Add”.

**Collapsible** “Property, docs & activity”:

- Property type · document number. If GPS present, “Navigate to site” (Google Maps, new tab).
- Work requirement: site classification, each connection `{type} · {load} · {phase} Phase`, inspection notes.
- Files: photos (caption or fileName) and documents (`{type} — {fileName}`).
- Activity timeline if any activities have `entityId === project.id`.
- Outline “View customer profile”.

**Update stage modal**

- Title `Update: {currentStage}`.
- Status select (allowed options only).
- Notes textarea.
- RR Number input only on last stage.
- Cancel / Save → `PATCH /projects/:id` with stages, currentStage, status, optional rr fields and completionDate (see §8).

**Record payment modal**

- Caption `{customer} · {projectId}`.
- Type, Amount*, Date* (default today), Mode (default UPI), Reference Number, Remarks.
- `POST /payments`. Then refresh data and close.

**Edit total amount modal**

- Number > 0 required.
- If payments exist, show “Paid so far: …”.
- `PATCH /projects/:id` with `{ totalAmount }`.

### 10.11 Edit work `/projects/:id/edit`

Header: `Edit Work` / `{customer} · {id}`. Back to `/projects`.

Read-only: Customer, Project ID.

Editable:

- Property (this customer’s properties only).
- Site Classification.
- Status: Active, Completed, On Hold, Cancelled.
- Total Project Amount.
- Connections (add/remove; keep ids when present). At least one required.
- Inspection Notes.
- Closure: RR Number, RR Received Date, Closing Remarks.
- Documents & photos: list existing; add one new document (type select: Field Report, Work Order, Power Sanction, Application, Estimate, Other + file name) via `POST /documents`.

Submit `PATCH /projects/:id` then optional document create, then go to project detail. Show loading state until form is hydrated from the project.

### 10.12 Payments `/payments`

Header: `Payments` / `Total · Paid · Remaining for each customer & project`.

- Full-width “Record Payment”.
- Customer filter `<select>` (All customers / `{name} · {village}`).
- Empty: CreditCard icon, “No payments for this selection”, Record First Payment.

Each customer card:

- Name, `{mobile} · {village}`, payment count.
- If more than one project, show customer-level PaymentBalanceSummary.
- Each project is a nested bordered block. Header click → project detail (`{id}` + current stage).
- Inside: project PaymentBalanceSummary (sm), type breakdown, each payment row (type, `{date} · {mode}`, optional `Ref:`, amount).
- If no payments and no target: “No payments recorded for this project yet”.

**Record Payment modal** (same fields as project detail, plus Customer* and Project* selects). Changing customer clears project. Project options: `{id} · {currentStage}` for that customer. Default type Customer Advance, mode UPI, date today.

### 10.13 Reports `/reports`

Header: `Reports` / `Quick view of work, money & customers`.

**Current app computes reports on the client from the snapshot.** There is also `GET /reports` on the API with a smaller payload. Reproduce the **richer client-side reports** described here so the UI does not regress. You may use `GET /reports` only if it is extended to cover every widget below.

Horizontal pill tabs: Overview, Work, Payments, Customers.

**Always-visible KPI row (2×2 on mobile, 4 across on desktop)** — clicking a tile switches tab:

- Total received (green) → Payments tab
- Balance due (amber) → Payments tab
- Active works (count) → Work tab
- Customers (count) → Customers tab

**Overview tab**

- Collection progress (if totalAgreed > 0): bar (green at 100%, else primary) + three tiles Target / Received / Remaining.
- Work status card: Active, Completed, On Hold, Cancelled counts.
- “Where money came from”: top 4 payment types as bars scaled to the max type amount.
- “Highest balance due”: top 5 due projects (hasTarget && remaining > 0), sorted by remaining desc. Row click → project.

**Work tab**

- Status counts: Total, Active, Completed, Cancelled.
- “Active work by stage”: one bar per workflow stage, count of **active** projects on that stage. Empty stages show 0. Bar width relative to the max stage count (minimum visual 8% if count > 0).
- “Active works list”: each active project with customer, id, stage, paid/total and due (or “No target”). Click → project.

**Payments tab**

- Transactions count, Projects with dues count.
- Payment by type: all types, bar + “N% of total received”.
- Table “Projects with balance due”: Customer, Project, Paid / Total, Due. Row click → project. Horizontal scroll if needed (`min-width ~520px`).
- “Top collections by project”: top 8 with paid > 0, sorted by paid desc.

**Customers tab**

- Total, New this month (createdAt month/year === now), Multi-project count.
- “Customers by village”: top 6 villages by customer count, bars.
- “Customer payment snapshot”: customers with hasTarget or paid > 0, sorted by remaining desc, max 10. Click → customer detail.

### 10.14 Search `/search`

Header: `Search` / `Find customers, projects, properties`. Back to `/`. Autofocus.

Placeholder: `Name, mobile, Aadhaar, SR/PRJ number, RR number...`

- Fewer than 2 characters after typing: “Type at least 2 characters to search”.
- ≥ 2 characters: filter locally (current app) **or** `GET /search?q=`.
- No hits: `No results found for "{query}"`.
- Hits: count, then cards. Click navigates to `result.link`.

Result shape:

```
{ type: 'customer' | 'project' | 'property', id, title, subtitle, link }
```

Match rules (case-insensitive):

- Customer: name, mobile, aadhaar, village → title name, subtitle `{mobile} · {village}`, link `/customers/{id}`.
- Property: documentNumber → title documentNumber, subtitle `{type} · {customerName}`, link `/customers/{customerId}`.
- Project: id, status, rrNumber, any connection type → title project id, subtitle `{currentStage} · {customerName}`, link `/projects/{id}`.

Footer chips (informational only, not filters): Customer Name, Mobile, Aadhaar, Document No., SR Number, Project No., RR Number, Village, Status.

There is also `GET /search?q=` with the same result shape. Either local search on the snapshot or the endpoint is acceptable if results match.

### 10.15 Settings `/settings`

Header: `Settings` / `Profile & preferences`. Max width ~42rem.

**Profile card:** Name*, Mobile*, Email.

**Company Information:** Company Name, Location.

Primary full-width Save → `PUT /auth/profile`. Button becomes `Saved!` for 2 seconds.

**Security card:** Current Password*, New Password* (min 6). Outline “Update Password” → `PUT /auth/password` `{ currentPassword, newPassword }`. Success: “Password updated” and clear fields. Failure: show API / exception message.

Danger full-width Logout.

Footer: small logo + `VEEW OS v1.0 · Meter Installation Module` + `Vinayaka Electricals & Engineering Works, Chitradurga`.

---

## 11. Shared UI primitives to recreate

You do not need the same component names, but you need the same behaviors.

| Primitive | Behavior |
|-----------|----------|
| Button | variants primary / secondary / outline / ghost / danger; sizes sm/md/lg; fullWidth; disabled opacity; min-height 44px; icon+label gap |
| Input / Select / Textarea | label, required asterisk, error text, 44px height, primary focus ring |
| Card | white, rounded-2xl, optional click scale |
| Modal | mobile: bottom sheet (`rounded-t-2xl`); desktop: centered. Backdrop click + X closes. Sticky title. Footer row of two equal buttons |
| EmptyState | icon in slate well, title, description, optional action |
| Tooltip | hover label above trigger (used on table actions and amount) |
| Header | see layout chrome |
| Logo | `/logo.jpg`, object-contain; optional link to `/` |
| Badge | status pill |
| PaymentBalanceSummary / PaymentTypeBreakdown | see §7 |
| WorkflowStepper | see §8 |
| ActivityTimeline | vertical dots, type, description, formatted datetime |
| StatCard | exists in current code but Home uses custom tiles; optional |

Modals used: delete customer, record payment (2 entry points), update stage, edit total amount.

---

## 12. API contract the frontend must consume

Base path: `/api`. In local dev, proxy `/api` to the backend origin (current: `http://localhost:4000`). In production, point the frontend at the new backend URL (env var). Enable CORS on the backend for the frontend origin.

All JSON requests: `Content-Type: application/json`.  
All authenticated requests: `Authorization: Bearer <token>`.

Errors: HTTP 4xx/5xx with JSON `{ "error": "message" }`. Validation may include `{ "details": [...] }`. Show `error` in the UI.

PDF download is **not** JSON: `GET /customers/:id/lighting-form` returns `application/pdf` with `Content-Disposition: attachment; filename="lighting-form-{id}.pdf"`. Trigger a file save in the browser (current app: blob → temporary `<a download>`). Filename: `lighting-form-{customerId}.pdf`.

Health (optional, unauthenticated): `GET /health` → `{ ok: true, ... }`.

### Auth

| Method | Path | Auth | Body | Success |
|--------|------|------|------|---------|
| POST | `/auth/login` | no | `{ password }` | `{ token, profile }` |
| GET | `/auth/me` | yes | — | `{ profile }` |
| PUT | `/auth/profile` | yes | partial profile | `{ profile }` |
| PUT | `/auth/password` | yes | `{ currentPassword, newPassword }` | `{ ok: true }` |

Login 401: invalid password. `/auth/me` 401: session expired — clear token.

### Snapshot and lists

| Method | Path | Notes |
|--------|------|-------|
| GET | `/data` | Full snapshot used by the current app after login |
| GET | `/customers` | Customer array |
| GET | `/customers/:id` | One customer |
| GET | `/properties` | All properties |
| GET | `/projects` | All projects |
| GET | `/projects/:id` | One project |
| GET | `/payments` | All payments |
| GET | `/search?q=` | Search results; ignore queries shorter than 2 chars |
| GET | `/reports` | Aggregated report object (see below) |

`GET /reports` shape (if you use it; current UI is richer than this):

```
{
  projects: { total, active, completed, cancelled },
  workflow: [{ stage, count }],
  payments: { totalReceived, count, byType: Record<string, number>,
              byProject: [{ id, customer, total, count }] },
  customers: { total, newThisMonth, multiProject }
}
```

### Mutations the UI actually calls

| Method | Path | Body | Success |
|--------|------|------|---------|
| POST | `/customers` | name, fatherSpouseName, mobile, village, panchayat, taluk, district, pinCode, aadhaar, pan? | Customer 201 |
| PUT | `/customers/:id` | partial customer fields | Customer |
| DELETE | `/customers/:id` | — | `{ ok: true }` |
| POST | `/customers/:id/contacts` | name, relationship, mobile, whatsapp?, notes? | Updated Customer 201 |
| PUT | `/customers/:id/contacts` | `{ contacts: [{ id?, name, relationship, mobile, whatsapp?, notes? }] }` | Updated Customer |
| GET | `/customers/:id/lighting-form` | — | PDF blob |
| POST | `/properties` | customerId, type, documentNumber, documentType, latitude?, longitude?, sitePhoto? | Property 201 |
| PUT | `/properties/:id` | type?, documentNumber?, documentType?, latitude?, longitude? (no customerId) | Property |
| POST | `/projects` | customerId, propertyId, siteClassification, connections[{ type, requiredLoad, phase, remarks? }], inspectionNotes?, totalAmount? | Project 201 |
| PATCH | `/projects/:id` | any of: status, currentStage, stages, siteClassification, propertyId, connections[{ id?, type, requiredLoad, phase, remarks? }], inspectionNotes, totalAmount, rrNumber, rrReceivedDate, completionDate, closingRemarks | Project |
| POST | `/payments` | projectId, customerId?, type, amount (number), date, mode, referenceNumber?, remarks? | Payment 201 |
| POST | `/documents` | type, fileName, description?, customerId?, propertyId?, projectId? | Document 201 |
| POST | `/photos` | projectId, fileName, caption? | Photo 201 |

`amount` and `totalAmount` must be **JSON numbers**, not strings.

### Endpoints that exist but the current UI does not use

You may ignore these unless the new backend removes the snapshot and you need them:

- `GET /service-requests`, `POST /service-requests`, `GET/PATCH /service-requests/:id`, `POST /service-requests/:id/convert`
- `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

---

## 13. Data loading and error handling

Recommended (matches current app):

1. Auth provider restores session via `GET /auth/me`.
2. When `isAuthenticated` becomes true, fetch `GET /data` once.
3. Every mutation: call the write endpoint, then **refresh the snapshot** (or patch local state equivalently).
4. Show a loading splash until auth is ready. List pages can render empty arrays while snapshot loads; detail pages show “not found” if the id is missing after load — distinguish loading vs missing if you can (current edit pages show “Loading …” until hydrated).
5. Network/API failures on forms: inline banner with `error.message`.
6. Do not silently swallow failed login except converting it to the invalid-password message.

---

## 14. Responsive and field-use details

- Designed for one-handed phone use: full-width primary actions, bottom nav, large tap targets.
- Tables (customers list, due-projects report) may overflow-x on mobile; that is acceptable.
- Modals become bottom sheets on small screens.
- `select` elements use `appearance-none` and min height 44px.
- Hide number input spinners if your stack shows them.
- `active:scale-[0.99]` on tappable cards is the current micro-interaction; optional but nice.
- Safe-area: bottom nav should respect iOS home indicator if you can (`safe-area-bottom`).

---

## 15. Suggested implementation order

Build in this order so the app is demoable early:

1. App shell, routing, design tokens, logo, login + session.
2. API client (token, JSON, PDF download, error type).
3. Snapshot load + domain types + payment helpers + formatters.
4. Home + ProjectWorkCard + stepper.
5. Customers list / create / detail / edit / delete.
6. Projects list / create / detail (stage update + payment + total) / edit.
7. Payments page.
8. Reports.
9. Search.
10. Settings + lighting-form download.
11. Empty, error, and not-found states.
12. Mobile + desktop pass.

---

## 16. Acceptance checklist

The new frontend is done when all of the following are true:

- [ ] Password login, session restore, logout, and protected routing work.
- [ ] Login screen is a purple night / glass card composition, not a generic form.
- [ ] Desktop sidebar and mobile bottom nav match the information architecture above.
- [ ] Home KPIs and active-work queue match the formulas in §7.
- [ ] Creating a customer also creates property + project and lands on the project page.
- [ ] Customer delete requires typing the exact name and warns about cascade + outstanding balance.
- [ ] Work queue filters and search work.
- [ ] Stage update uses per-stage status lists and auto-advances including project completion on last-stage Completed.
- [ ] RR number can be entered on the last stage and shows as a green pill.
- [ ] Agreed total, paid, and remaining stay consistent on Home, customer, project, payments, and reports.
- [ ] Recording a payment from Payments page or Project detail appears everywhere after refresh.
- [ ] Reports four tabs show the widgets listed in §10.13.
- [ ] Search returns customers, properties, and projects from 2+ characters.
- [ ] Settings can update profile and password.
- [ ] Generate document downloads a PDF for the customer.
- [ ] GPS capture and Google Maps “Navigate to site” work when the browser allows geolocation.
- [ ] Call links open the phone dialer.
- [ ] File inputs never pretend to upload bytes; they store names and show the helper note.
- [ ] INR formatting and `en-IN` dates are used everywhere money/dates appear.
- [ ] Service-request and notification routes do not show dedicated pages.
- [ ] The UI is usable on a ~390px-wide phone and a desktop breakpoint.

---

## 17. Source files in the current app (reference only)

Use these only to clarify behavior or copy visual details. Do not treat the stack as mandatory.

| Area | Path |
|------|------|
| Routes | `client/src/App.tsx` |
| Types | `client/src/types/index.ts` |
| API client | `client/src/api/client.ts` |
| Auth | `client/src/context/AuthContext.tsx` |
| Data + search | `client/src/context/DataContext.tsx` |
| Payment math | `client/src/utils/payments.ts` |
| Formatters / validation | `client/src/utils/formatters.ts`, `client/src/utils/validation.ts` |
| Tokens / login CSS | `client/src/index.css` |
| Shell / nav / header | `client/src/components/layout/` |
| Pages | `client/src/pages/` |
| API routes (contract) | `server/src/routes/index.ts` |

---

## 18. Open points for the new backend (frontend implications)

Confirm these with the backend agent; they change client code, not product scope:

1. **Base URL and CORS** for the deployed frontend.
2. Whether `GET /data` snapshot remains. If not, the frontend must fan out to list endpoints and join locally.
3. Whether JWT storage stays `localStorage` or moves to httpOnly cookies. If cookies, drop the `Authorization` header and use `credentials: 'include'`.
4. Whether file **bytes** will be accepted (multipart). Today, send `{ fileName }` only. When binary upload lands, keep the same document categories and attach `customerId` / `propertyId` / `projectId`.
5. Lighting-form PDF path and filename.
6. Login: password-only vs email+password. Keep password-only unless the backend changes.

Until those are confirmed, implement against the contract in §12.

---

End of brief. Rebuild the product, not the framework.
