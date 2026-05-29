# TaxiMela — Business Owner Flow
> Complete process documentation from first touch to active business management.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Step 1 — Open TaxiMela Website & Authenticate](#2-step-1--open-taximela-website--authenticate)
   - 2.1 [Sign Up (New Owner)](#21-sign-up-new-owner)
   - 2.2 [Sign In (Returning Owner)](#22-sign-in-returning-owner)
   - 2.3 [Session Mechanics](#23-session-mechanics)
   - 2.4 [Token Lifecycle & Auto-Logout](#24-token-lifecycle--auto-logout)
3. [Step 2 — Business Dashboard (Hub)](#3-step-2--business-dashboard-hub)
4. [Step 3A — Create Business Profile](#4-step-3a--create-business-profile)
   - 4.1 [Section 1: Owner Verification](#41-section-1-owner-verification)
   - 4.2 [Section 2: Business Verification](#42-section-2-business-verification)
   - 4.3 [Section 3: Business Details](#43-section-3-business-details)
   - 4.4 [Section 4: Service Location](#44-section-4-service-location)
   - 4.5 [Submit Business for Approval](#45-submit-business-for-approval)
   - 4.6 [Validation Rules](#46-validation-rules)
5. [Step 3B — View Application Status](#5-step-3b--view-application-status)
6. [Step 4 — Admin Review (Off-Platform Gate)](#6-step-4--admin-review-off-platform-gate)
7. [Step 3C — Manage Businesses](#7-step-3c--manage-businesses)
   - 7.1 [Edit Business Information](#71-edit-business-information)
   - 7.2 [Save Changes (Immediate)](#72-save-changes-immediate)
8. [Data Contracts](#8-data-contracts)
9. [API Reference](#9-api-reference)
10. [State & Storage Map](#10-state--storage-map)
11. [Error Handling Matrix](#11-error-handling-matrix)
12. [Complete Flow Diagram](#12-complete-flow-diagram)

---

## 1. Overview

The business owner flow follows this top-level structure, matching the product diagram:

```
Open TaxiMela Website
        ↓
  Register / Login
        ↓
  Business Dashboard  ◄─────────────────────────────────┐
        │                                                │
   ┌────┴──────────────────┬──────────────────────┐     │
   ▼                       ▼                      ▼     │
Create Business        Manage                View       │
Profile                Businesses            Application│
   │                       │                Status      │
   ▼                       ▼                   │        │
Submit Business        Edit Business       [3 outcomes] │
for Approval           Information             │        │
                           │              Approved ─────┘
                           ▼              Pending (wait)
                       Save Changes       Rejected (re-submit)
                       (immediate)
                                    ↑
                              Admin Review
                           (off-platform gate)
```

The **Business Dashboard is the central hub** after authentication. All three main actions branch from it.

---

## 2. Step 1 — Open TaxiMela Website & Authenticate

Route: `/login`  
The owner opens the TaxiMela website and either creates a new account or signs in to an existing one.

### 2.1 Sign Up (New Owner)

```
Owner fills: Email + Password (+ optional Full Name)
        │
        ▼
Firebase createUserWithEmailAndPassword(email, password)
        │
        ↳ Returns: { uid, Firebase ID token }
        │
        ▼
POST /api/users
Authorization: Bearer <token>
Body: {
  full_name:            string | null,
  preferred_language:   "en",
  is_commuter:          false,
  is_business_owner:    false
}
  ↳ 409 / 400 silently ignored (user may already exist)
  ↳ Any other error is re-thrown and shown to the owner
        │
        ▼
setSession({ ownerId: uid, accessToken: token })
→ Stored in Zustand + persisted to localStorage["owner-session"]
        │
        ▼
Navigate to → /dashboard
```

### 2.2 Sign In (Returning Owner)

```
Owner fills: Email + Password
        │
        ▼
Firebase signInWithEmailAndPassword(email, password)
        │
        ↳ Returns: { uid, Firebase ID token }
        │
        ▼
setSession({ ownerId: uid, accessToken: token })
        │
        ▼
Navigate to → /dashboard
```

**Firebase error messages shown to the owner:**

| Firebase code | Message displayed |
|---|---|
| `auth/email-already-in-use` | This email is already registered. Please sign in instead. |
| `auth/weak-password` | Password should be at least 6 characters. |
| `auth/invalid-email` | Please enter a valid email address. |
| `auth/user-not-found` | No account found with this email. Please sign up. |
| `auth/wrong-password` | Incorrect password. Please try again. |

---

### 2.3 Session Mechanics

Session state is managed by a Zustand store with `localStorage` persistence.

**Store shape:**
```typescript
{
  ownerId:         string | null   // Firebase UID
  accessToken:     string | null   // Firebase ID token (JWT)
  isAuthenticated: boolean
}
```

**Persistence key:** `owner-session` in `localStorage`

`AuthProvider` runs a Firebase `onAuthStateChanged` listener for the entire app lifetime:
- Firebase reports live user → force-refresh token → `setSession`
- Firebase reports no user → `clearSession`
- Sets `isLoading = false` after first resolution

On hard page reload, session is re-hydrated from `localStorage` (instant) and confirmed by Firebase SDK (async).

All protected routes (`/dashboard`, `/registration`, `/status`, `/businesses/[id]`) are wrapped in `ProtectedRoute`:

```
isLoading = true                              → Show loading screen
isLoading = false + isAuthenticated = false   → Redirect to /login
isLoading = false + isAuthenticated = true    → Render page
```

---

### 2.4 Token Lifecycle & Auto-Logout

```
Firebase ID token issued (valid 60 min)
        │
        ├─► Firebase SDK auto-refreshes at ~55 min
        │     ↳ onAuthStateChanged fires → setSession with fresh token
        │
        └─► If token expires (network issue, etc.)
                │
                └─► Next API call returns HTTP 401
                      │
                      └─► apiRequest() 401 interceptor:
                            clearSession()
                            window.location.href = "/login"
```

No manual refresh logic is needed anywhere in the app.

---

## 3. Step 2 — Business Dashboard (Hub)

Route: `/dashboard`  
Protected by: `ProtectedRoute`

This is the **first screen the owner sees after login** and the central hub for all actions.

**Two parallel data fetches on mount:**

```
GET /api/businesses/dashboard-summary
Authorization: Bearer <accessToken>
↳ Response: {
    total_count:         number   // all applications ever submitted
    pending_application: number   // currently under review
    accepted:            number   // approved applications
    rejected:            number   // rejected applications
  }

GET /api/businesses
Authorization: Bearer <accessToken>
↳ Response: {
    data:  Business[],
    total: number,
    page:  number,
    limit: number
  }
```

**Dashboard layout:**

```
┌──────────────────────────────────────────────────────┐
│  Overview                       [+ New Registration] │
│  Dashboard                                           │
├──────────┬──────────┬──────────┬────────────────────┤
│  Total   │ Pending  │ Approved │ Rejected            │
│    N     │    N     │    N     │    N                │
├──────────┴──────────┴──────────┴────────────────────┤
│  MY BUSINESSES                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Business Name                  [Active]  →  │   │
│  │  Category                                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  View applications    Back to register               │
└──────────────────────────────────────────────────────┘
```

**From the Dashboard the owner can:**
- `+ New Registration` → goes to **Create Business Profile** (`/registration`)
- Click a business row → goes to **Manage Businesses** (`/businesses/[id]`)
- `View applications` → goes to **View Application Status** (`/status`)

Business rows show `Active` (green) or `Suspended` (red) status badges.  
If no approved businesses exist yet, an empty state links to `/status`.

---

## 4. Step 3A — Create Business Profile

Route: `/registration`  
Protected by: `ProtectedRoute`  
Accessed from: Dashboard `+ New Registration` button

The registration form is divided into **4 sections** the owner must complete in full before submitting.

---

### 4.1 Section 1: Owner Verification

Collects the owner's personal identity documents.

| Field | Type | Validation |
|---|---|---|
| National ID Number (`government_id_fan`) | Text input | Required · Exactly 12 digits · regex `/^\d{12}$/` |
| National ID Photo (`government_id_photo`) | File upload | Required · `instanceof File` · Max 5 MB |
| Business License Number (`business_licence_number`) | Text input | Required · Min 1 character after trim |

The photo field is a styled drop zone. On file selection, a local preview renders immediately via `URL.createObjectURL()` — no upload happens yet.

---

### 4.2 Section 2: Business Verification

Collects the business identity documents.

| Field | Type | Validation |
|---|---|---|
| Business Name (`business_name`) | Text input | Required · Min 1 character after trim |
| Business License Photo (`business_license_photo`) | File upload | Required · `instanceof File` · Max 5 MB |

---

### 4.3 Section 3: Business Details

| Field | Type | Validation | Data source |
|---|---|---|---|
| Category (`category_id`) | Select dropdown | Required | `GET /api/business-categories` — fetched on mount, no auth required, cached for session |

---

### 4.4 Section 4: Service Location

| Field | Type | Validation |
|---|---|---|
| Latitude (`locationLat`) | Number from map click | Required · must be a finite number |
| Longitude (`locationLng`) | Number from map click | Required · must be a finite number |

An interactive Leaflet map centered on **Addis Ababa (9.03, 38.74)** by default. The owner clicks anywhere on the map to drop a pin. Coordinates are written into the form via React Hook Form's `Controller`. The map is dynamically imported with `{ ssr: false }` to prevent server-side rendering errors.

---

### 4.5 Submit Business for Approval

Once all 4 sections are complete, the owner clicks **Complete Registration**. The submission runs a 3-step pipeline:

```
Step 1 — Client-side validation (Zod schema)
  All 8 fields validated before any network call.
  Errors shown inline below each field.
  If any field fails → stop, show errors, do not proceed.
        │
        ▼
Step 2 — Parallel file uploads to Cloudinary
  Promise.all([
    uploadToCloudinary(government_id_photo),    → secure_url
    uploadToCloudinary(business_license_photo)  → secure_url
  ])
  POST https://api.cloudinary.com/v1_1/<cloud>/auto/upload
  FormData: { file, upload_preset }
  Files go directly from browser to Cloudinary.
  Backend never handles binary data.
        │
        ▼
Step 3 — Submit registration to backend
  POST /api/auth/business-registration
  Authorization: Bearer <accessToken>
  Body: {
    business_name,
    category_id,
    latitude,
    longitude,
    government_id_fan,
    business_licence_number,
    government_id_photo_url,        ← Cloudinary URL
    business_license_photo_url      ← Cloudinary URL
  }
  ↳ Response: { message, data: { id, business_name, status: "pending_review" } }
        │
        ▼
  On success → Navigate to /status
```

---

### 4.6 Validation Rules

```typescript
{
  business_name:           string  · trim · min(1)
  category_id:             string  · min(1)
  government_id_fan:       string  · trim · regex /^\d{12}$/
  business_licence_number: string  · trim · min(1)
  government_id_photo:     File    · instanceof File · size ≤ 5,242,880 bytes
  business_license_photo:  File    · instanceof File · size ≤ 5,242,880 bytes
  locationLat:             number  · finite number (not null)
  locationLng:             number  · finite number (not null)
}
```

---

## 5. Step 3B — View Application Status

Route: `/status`  
Protected by: `ProtectedRoute`  
Accessed from: Dashboard `View applications` link, or auto-redirect after registration submit

Shows all registration applications the owner has ever submitted and their current review state.

**Data fetch:**
```
GET /api/business-registrations
Authorization: Bearer <accessToken>
↳ Response: {
    data: Application[],
    total: number,
    page:  number,
    limit: number
  }
```

**Application shape:**
```typescript
{
  id:               string
  business_name:    string
  status:           "pending_review" | "approved" | "rejected"
  rejection_reason: string | null
}
```

**Three possible outcomes per application:**

| Status | Badge | What the owner sees | What happens next |
|---|---|---|---|
| `pending_review` | Amber — Pending Review | Application is under admin review | Owner waits — no action available |
| `approved` | Green — Approved | Application was approved | Business is now active — visible in Dashboard |
| `rejected` | Red — Rejected | Rejection reason shown below business name | Owner can submit a new registration |

The owner can start a new registration at any time via the `+ New` button.

---

## 6. Step 4 — Admin Review (Off-Platform Gate)

This step happens entirely in the **TaxiMela admin panel**, outside the owner web app. It is the gate between a submitted application and an active business appearing in the Dashboard.

```
Admin receives application in admin panel
        │
        ├─► Admin reviews:
        │     · National ID number
        │     · National ID photo (Cloudinary URL)
        │     · Business license number
        │     · Business license photo (Cloudinary URL)
        │     · Business name
        │     · Category
        │     · Location pin (lat/lng)
        │
        ├─► Decision: APPROVE
        │     ↳ Backend creates new record in `businesses` table
        │     ↳ Application status → "approved"
        │     ↳ Business status    → "active"
        │     ↳ approved_by + approved_at fields populated
        │     ↳ Business now appears in owner's Dashboard
        │
        └─► Decision: REJECT
              ↳ Application status → "rejected"
              ↳ rejection_reason field populated
              ↳ Owner sees reason on /status
              ↳ Owner can submit a new registration
```

**Key distinction:** `business_registrations` and `businesses` are separate database tables. An approved application creates a new row in `businesses`. The Dashboard and `/businesses/[id]` only show data from `businesses` — never from `business_registrations`.

---

## 7. Step 3C — Manage Businesses

Route: `/businesses/[id]`  
Protected by: `ProtectedRoute`  
Accessed from: Dashboard — click any business row

Only available for businesses that have been **approved** by admin (status: `active` or `suspended`).

**Data fetch on mount:**
```
GET /api/businesses/:id
Authorization: Bearer <accessToken>
↳ Response: { data: Business }
```

**Business shape:**
```typescript
{
  id:                      string
  name:                    string
  latitude:                number
  longitude:               number
  government_id_fan:       string
  government_id_photo_url: string
  business_logo:           string | null
  license_photo_url:       string
  status:                  "active" | "suspended"
  approved_by:             string | null
  approver_name:           string | null
  category_id:             string | null
  category_name:           string | null
  approved_at:             string | null
  created_at:              string
  updated_at:              string
}
```

**View mode displays:**
- Business name + category
- Status badge (Active / Suspended)
- Location coordinates
- Links to National ID photo and Business License photo (open in new tab)
- Approval date

---

### 7.1 Edit Business Information

The owner clicks **Edit** to enter edit mode. The form pre-populates from the fetched business data.

**Editable fields:**

| Field | Validation |
|---|---|
| Business Name | Required · min 1 char after trim |
| Category | Required · must select a value |
| Location | Required · must click map to set new lat/lng |
| Business Logo | Optional · image files only |

---

### 7.2 Save Changes (Immediate)

Edits are applied **immediately** — there is no second approval step for business edits.

```
Step 1 — Conditional logo upload (only if a new file was selected)
  uploadToCloudinary(business_logo)
  ↳ Returns: secure_url
        │
        ▼
Step 2 — PATCH business
  PATCH /api/businesses/:id
  Authorization: Bearer <accessToken>
  Body: {
    business_name,
    category_id,
    latitude,
    longitude,
    business_logo?    ← only included if new logo was uploaded
  }
  ↳ Response: { data: Business, message: string }
        │
        ▼
Step 3 — On success
  Invalidate TanStack Query cache:
    ["business", id]    ← refreshes this page
    ["my-businesses"]   ← refreshes Dashboard list
  Return to view mode
```

---

## 8. Data Contracts

### Registration Payload
```typescript
{
  business_name:              string   // e.g. "Haile Coffee"
  category_id:                string   // UUID from /api/business-categories
  latitude:                   number   // e.g. 9.0192
  longitude:                  number   // e.g. 38.7525
  government_id_fan:          string   // 12-digit Ethiopian National ID
  business_licence_number:    string   // TIN / license number
  government_id_photo_url:    string   // Cloudinary CDN URL
  business_license_photo_url: string   // Cloudinary CDN URL
}
```

### Update Business Payload
```typescript
{
  business_name?: string
  category_id?:   string
  latitude?:      number
  longitude?:     number
  business_logo?: string   // Cloudinary CDN URL
}
```

### Session Store
```typescript
{
  ownerId:         string   // Firebase UID
  accessToken:     string   // Firebase ID token (JWT, ~60 min TTL)
  isAuthenticated: boolean
}
```

---

## 9. API Reference

All requests go to `NEXT_PUBLIC_API_BASE_URL`. Authenticated endpoints require `Authorization: Bearer <accessToken>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/users` | Yes | Create user record on sign up |
| `GET` | `/api/business-categories` | No | Fetch category list for registration form |
| `POST` | `/api/auth/business-registration` | Yes | Submit registration application |
| `GET` | `/api/business-registrations` | Yes | List owner's applications (status page) |
| `GET` | `/api/business-registrations/:id` | Yes | Get single application detail |
| `GET` | `/api/businesses/dashboard-summary` | Yes | Get stats (total / pending / approved / rejected) |
| `GET` | `/api/businesses` | Yes | List owner's approved businesses |
| `GET` | `/api/businesses/:id` | Yes | Get single business detail |
| `PATCH` | `/api/businesses/:id` | Yes | Save business edits immediately |

**External:**

| Method | URL | Purpose |
|---|---|---|
| `POST` | `https://api.cloudinary.com/v1_1/<cloud>/auto/upload` | Upload files directly from browser (unsigned preset) |

---

## 10. State & Storage Map

| Data | Where stored | Lifetime | Written by | Read by |
|---|---|---|---|---|
| `ownerId`, `accessToken`, `isAuthenticated` | Zustand + `localStorage["owner-session"]` | Until `clearSession()` | Login page, AuthProvider | Every protected page, all API calls |
| Firebase auth state | Firebase SDK internal cache | Until `signOut()` | Firebase SDK | `onAuthStateChanged` in AuthProvider |
| Business categories | TanStack Query `["business-categories"]` | Session | `getBusinessCategories()` | Registration form, Business edit form |
| Dashboard summary | TanStack Query `["dashboard-summary"]` | Session | `getDashboardSummary()` | Dashboard |
| Businesses list | TanStack Query `["my-businesses"]` | Session | `getMyBusinesses()` | Dashboard |
| Single business | TanStack Query `["business", id]` | Session | `getBusinessById()` | Business detail page |
| Applications list | TanStack Query `["my-applications"]` | Session | `getMyApplications()` | Status page |
| File previews | Component `useState` (object URL) | Component lifetime | FileInput `onChange` | FileInput render |

---

## 11. Error Handling Matrix

| Scenario | Where caught | What the owner sees |
|---|---|---|
| Firebase sign in / sign up error | `login/page.tsx` try/catch | Inline error message in form |
| File too large (> 5 MB) | Zod schema on submit | Inline error below upload zone |
| Missing required field | Zod schema on submit | Inline error below each field |
| Cloudinary upload failure | `submitMutation` `isError` | Error banner below submit button |
| Backend registration failure | `submitMutation` `isError` | Error banner with backend message |
| Business update failure | `updateMutation` `isError` | Error banner below save button |
| HTTP 401 on any API call | `apiRequest()` interceptor | Session cleared → redirect to `/login` |
| Business not found / fetch error | `isError` query state | Full-page error with "Go back" link |
| `NEXT_PUBLIC_API_BASE_URL` not set | `apiRequest()` | Throws — app cannot function |
| Cloudinary env vars not set | `uploadToCloudinary()` | Throws — file upload cannot function |

---

## 12. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Open TaxiMela Website                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Register / Login                           │
│                                                                 │
│   Sign Up                              Sign In                  │
│   · Email + Password (+ name)          · Email + Password       │
│   · Firebase createUser                · Firebase signIn        │
│   · POST /api/users                    · setSession             │
│   · setSession                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Business Dashboard                          │
│                                                                 │
│   Metric cards: Total · Pending · Approved · Rejected           │
│   Business list rows (approved businesses only)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│ Create Business  │ │    Manage       │ │  View Application    │
│    Profile       │ │  Businesses     │ │      Status          │
│  /registration   │ │ /businesses/[id]│ │      /status         │
└──────────────────┘ └─────────────────┘ └──────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│  4-Section Form  │ │  Edit Business  │ │  Per application:    │
│  1. Owner Verify │ │  Information    │ │  · pending_review    │
│  2. Biz Verify   │ │  · Name         │ │    → wait            │
│  3. Biz Details  │ │  · Category     │ │  · approved          │
│  4. Location     │ │  · Location     │ │    → see Dashboard   │
└──────────────────┘ │  · Logo         │ │  · rejected          │
          │          └─────────────────┘ │    → re-submit       │
          ▼                   │          └──────────────────────┘
┌──────────────────┐          ▼                   │
│ Zod Validation   │ ┌─────────────────┐          │ (pending)
│ Cloudinary       │ │  Save Changes   │          ▼
│ file uploads     │ │  (immediate)    │ ┌──────────────────────┐
│ POST /api/auth/  │ │  PATCH          │ │    Admin Review      │
│ business-        │ │  /api/businesses│ │  (off-platform)      │
│ registration     │ │  /:id           │ │                      │
└──────────────────┘ └─────────────────┘ │  APPROVE → active   │
          │                   │          │  REJECT  → reason   │
          ▼                   │          └──────────────────────┘
┌──────────────────┐          │                   │
│  /status         │          │            (approved)
│  pending_review  │          │                   │
└──────────────────┘          │                   ▼
          │                   │          ┌──────────────────────┐
          │                   └──────────► Business Dashboard   │
          │                              │  (business now       │
          └─────────────────────────────►│   visible in list)   │
                                         └──────────────────────┘
```

---

*Document version: 2.0 — aligned with product flow diagram*  
*Codebase: owner-web v0.1.0 · Next.js 16 · FastAPI backend*
