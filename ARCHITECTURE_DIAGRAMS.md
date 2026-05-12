# TaxiMela Business Owner Web - Architecture Diagrams

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Flutter)                      │
│  - Firebase Auth                                                 │
│  - Generates handoff token                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Opens browser with ?handoff=token
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Web App (This Project)                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Pages (App Router)                                      │   │
│  │  - /register (handoff landing)                           │   │
│  │  - /login (direct auth)                                  │   │
│  │  - /registration (main form) [PROTECTED]                 │   │
│  │  - /status (applications) [PROTECTED]                    │   │
│  │  - /dashboard (businesses) [PROTECTED]                   │   │
│  │  - /businesses/[id] (detail/edit) [PROTECTED]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Auth Layer                                              │   │
│  │  - AuthProvider (Firebase listener)                      │   │
│  │  - ProtectedRoute (route guard)                          │   │
│  │  - Session Store (Zustand + localStorage)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Layer                                               │   │
│  │  - API Client (fetch wrapper)                            │   │
│  │  - 401 Interceptor                                       │   │
│  │  - Bearer token injection                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS + Bearer Token
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Render Deployment)                 │
│              https://taximela-backend-kxmi.onrender.com          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Endpoints                                               │   │
│  │  - POST /api/auth/register                               │   │
│  │  - POST /api/auth/exchange-handoff-token                 │   │
│  │  - POST /api/business-registrations                      │   │
│  │  - GET /api/business-registrations                       │   │
│  │  - GET /api/businesses/dashboard-summary                 │   │
│  │  - GET /api/businesses                                   │   │
│  │  - GET /api/businesses/{id}                              │   │
│  │  - PATCH /api/businesses/{id}                            │   │
│  │  - GET /api/business-categories                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Firebase Admin SDK                                      │   │
│  │  - Verifies ID tokens                                    │   │
│  │  - Extracts user UID                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL Queries
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│                                                                   │
│  Tables:                                                          │
│  - users (firebase_uid, is_business_owner, is_commuter)          │
│  - business_registrations (applications)                         │
│  - businesses (approved only)                                    │
│  - business_categories (reference data)                          │
│  - admins (for review)                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│                                                                   │
│  Firebase Auth          Cloudinary                               │
│  - User management      - Document storage                       │
│  - Token generation     - Image optimization                     │
│  - Token refresh        - Unsigned upload                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flow

### Mobile Handoff Flow
```
┌──────────┐
│ Mobile   │
│ App      │
└────┬─────┘
     │ 1. User authenticated with Firebase
     │
     ↓
┌────────────────────────────────────┐
│ Backend: POST /api/auth/handoff    │
│ - Generates short-lived token      │
│ - Returns: { handoff_token }       │
└────┬───────────────────────────────┘
     │ 2. Opens browser
     │
     ↓
┌──────────────────────────────────────────────┐
│ Web: /register?handoff=TOKEN                 │
│ - Extracts token from URL                    │
└────┬─────────────────────────────────────────┘
     │ 3. Exchange token
     │
     ↓
┌────────────────────────────────────────────────┐
│ Backend: POST /api/auth/exchange-handoff-token│
│ - Validates handoff token                      │
│ - Returns: { firebase_token }                  │
└────┬───────────────────────────────────────────┘
     │ 4. Store token
     │
     ↓
┌──────────────────────────────────┐
│ Session Store (localStorage)     │
│ - accessToken: firebase_token    │
│ - ownerId: firebase_uid           │
│ - isAuthenticated: true           │
└────┬─────────────────────────────┘
     │ 5. Redirect
     │
     ↓
┌──────────────────────────────────┐
│ /registration (Protected)        │
│ - User can now register business │
└──────────────────────────────────┘
```

### Direct Login Flow
```
┌──────────┐
│ User     │
└────┬─────┘
     │ 1. Visits /login
     │
     ↓
┌──────────────────────────────────┐
│ Login Page                       │
│ - Email/password form            │
└────┬─────────────────────────────┘
     │ 2. Submit credentials
     │
     ↓
┌──────────────────────────────────┐
│ Firebase Auth                    │
│ - signInWithEmailAndPassword()   │
│ - Returns: { uid, token }        │
└────┬─────────────────────────────┘
     │ 3. Store token
     │
     ↓
┌──────────────────────────────────┐
│ Session Store (localStorage)     │
│ - accessToken: firebase_token    │
│ - ownerId: firebase_uid           │
│ - isAuthenticated: true           │
└────┬─────────────────────────────┘
     │ 4. Redirect
     │
     ↓
┌──────────────────────────────────┐
│ /registration (Protected)        │
│ - User can now register business │
└──────────────────────────────────┘
```

---

## 📝 Business Registration Flow

```
┌──────────────────────────────────────────────────────────────┐
│ User fills registration form                                  │
│ - Owner info (National ID)                                    │
│ - Business info (name, license)                               │
│ - Category selection                                          │
│ - Location pin on map                                         │
└────┬─────────────────────────────────────────────────────────┘
     │ 1. Submit form
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│ Client-side validation (Zod)                                  │
│ - National ID: 12 digits                                      │
│ - Files: max 5MB                                              │
│ - All required fields present                                 │
└────┬─────────────────────────────────────────────────────────┘
     │ 2. Upload documents
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│ Cloudinary Upload (Parallel)                                  │
│ - government_id_photo → URL1                                  │
│ - business_license_photo → URL2                               │
└────┬─────────────────────────────────────────────────────────┘
     │ 3. Submit to backend
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend: POST /api/business-registrations                     │
│ Headers: Authorization: Bearer <firebase-token>               │
│ Body: {                                                       │
│   business_name,                                              │
│   category_id,                                                │
│   latitude, longitude,                                        │
│   government_id_fan,                                          │
│   government_id_photo_url,                                    │
│   business_license_photo_url                                  │
│ }                                                             │
└────┬─────────────────────────────────────────────────────────┘
     │ 4. Backend processing
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend Actions:                                              │
│ 1. Verify Firebase token → Extract user UID                   │
│ 2. Check/create user in database                              │
│ 3. Set is_business_owner = true                               │
│ 4. Create business_registration record                        │
│    - status: pending_review                                   │
│    - user_id: from Firebase UID                               │
│ 5. Return: { id, status: "pending_review" }                   │
└────┬─────────────────────────────────────────────────────────┘
     │ 5. Success response
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│ Web: Redirect to /status                                      │
│ - Shows application with "Pending Review" badge               │
└──────────────────────────────────────────────────────────────┘
     │
     │ [Admin reviews in admin panel]
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│ Admin Actions (separate admin panel):                         │
│ - Reviews documents                                           │
│ - Approves or rejects                                         │
│                                                               │
│ If APPROVED:                                                  │
│   - Update business_registration.status = "approved"          │
│   - Create business record                                    │
│   - Copy data from registration                               │
│                                                               │
│ If REJECTED:                                                  │
│   - Update business_registration.status = "rejected"          │
│   - Set rejection_reason                                      │
└────┬─────────────────────────────────────────────────────────┘
     │ 6. User checks status
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│ /status page                                                  │
│ - Shows updated status                                        │
│ - If approved → business appears in /dashboard                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ User authenticates (login or handoff)                        │
└────┬────────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ Firebase returns ID token                                    │
│ - Expiry: 60 minutes                                         │
│ - Contains: user UID, email, claims                          │
└────┬────────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ Stored in Session Store (localStorage)                       │
│ - Key: "owner-session"                                       │
│ - Persists across page reloads                               │
└────┬────────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ AuthProvider listens to Firebase auth state                  │
│ - onAuthStateChanged() fires on:                             │
│   • Initial page load                                        │
│   • Token refresh                                            │
│   • Sign in/out                                              │
└────┬────────────────────────────────────────────────────────┘
     │
     │ Time passes (55 minutes)
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ Firebase SDK auto-refreshes token                            │
│ - Happens automatically at 55 min mark                       │
│ - New token valid for another 60 min                         │
└────┬────────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ onAuthStateChanged() fires with new token                    │
│ - AuthProvider updates session store                         │
│ - All subsequent API calls use fresh token                   │
└────┬────────────────────────────────────────────────────────┘
     │
     │ User makes API call
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ API Client injects token                                     │
│ - Header: Authorization: Bearer <fresh-token>                │
└────┬────────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend verifies token with Firebase Admin SDK               │
│ - Valid → Process request                                    │
│ - Invalid/Expired → Return 401                               │
└────┬────────────────────────────────────────────────────────┘
     │
     │ If 401 error
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│ API Client 401 Interceptor                                   │
│ - Clears session store                                       │
│ - Redirects to /login                                        │
│ - User must re-authenticate                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Data Models

### Frontend Types

```typescript
// Session Store
type SessionState = {
  ownerId: string | null;        // Firebase UID
  accessToken: string | null;    // Firebase ID token
  isAuthenticated: boolean;
  setSession: (payload) => void;
  clearSession: () => void;
}

// Registration Form
type RegistrationFormValues = {
  business_name: string;
  category_id: string;
  government_id_fan: string;     // 12-digit National ID
  government_id_photo: File;
  business_license_photo: File;
  locationLat: number;
  locationLng: number;
}

// Business Registration (from API)
type BusinessRegistration = {
  id: string;
  business_name: string;
  status: "pending_review" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
}

// Business (from API)
type Business = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  latitude: number;
  longitude: number;
  government_id_photo_url: string;
  license_photo_url: string;
  business_logo?: string;
  status: "active" | "suspended";
  approved_at: string;
}

// Dashboard Summary (from API)
type DashboardSummary = {
  total_count: number;
  pending_application: number;
  accepted: number;
  rejected: number;
}

// Business Category (from API)
type BusinessCategory = {
  id: string;
  name: string;
}
```

---

## 📦 Component Hierarchy

```
App (layout.tsx)
├── AppProviders
│   ├── AuthProvider (Firebase listener)
│   └── QueryClientProvider (TanStack Query)
│
├── /register
│   └── RegisterClient (handoff exchange)
│
├── /login
│   └── LoginForm (email/password)
│
├── /registration (ProtectedRoute)
│   ├── RegistrationForm
│   │   ├── SectionTitle (x4)
│   │   ├── FileInput (x2)
│   │   └── LocationPickerMap (dynamic import)
│   │       ├── MapContainer (Leaflet)
│   │       ├── TileLayer (OpenStreetMap)
│   │       ├── MapClickHandler
│   │       └── CircleMarker
│   └── Form (React Hook Form + Zod)
│
├── /status (ProtectedRoute)
│   └── StatusContent
│       └── ApplicationList
│           └── ApplicationCard (x N)
│
├── /dashboard (ProtectedRoute)
│   └── DashboardContent
│       ├── StatCard (x4)
│       └── BusinessList
│           └── BusinessCard (x N)
│
└── /businesses/[id] (ProtectedRoute)
    └── BusinessDetailContent
        ├── ViewMode
        │   ├── LocationDisplay
        │   └── DocumentLinks
        └── EditMode
            ├── EditForm
            └── LocationPickerMap (dynamic import)
```

---

## 🔌 API Integration Map

```
Frontend Component          →  API Endpoint                    →  Database Table
─────────────────────────────────────────────────────────────────────────────────
/register (handoff)         →  POST /api/auth/exchange-handoff →  N/A (token only)
/login                      →  Firebase Auth (client SDK)      →  N/A
/registration               →  GET /api/business-categories    →  business_categories
                            →  POST /api/business-registrations→  business_registrations
/status                     →  GET /api/business-registrations →  business_registrations
/dashboard                  →  GET /api/businesses/dashboard   →  business_registrations
                            →  GET /api/businesses             →  businesses
/businesses/[id] (view)     →  GET /api/businesses/{id}        →  businesses
/businesses/[id] (edit)     →  GET /api/business-categories    →  business_categories
                            →  PATCH /api/businesses/{id}      →  businesses
```

---

## 🎨 UI Component Patterns

### Status Badges
```
pending_review  →  🟡 Amber badge   "Pending Review"
approved        →  🟢 Emerald badge "Approved"
rejected        →  🔴 Rose badge    "Rejected"
active          →  🟢 Emerald badge "Active"
suspended       →  🔴 Rose badge    "Suspended"
```

### Form Sections
```
┌─────────────────────────────────────────┐
│ [1] Section Title                       │
│ ─────────────────────────────────────── │
│ LABEL (uppercase, tracked)              │
│ [Input field]                           │
│ Helper text                             │
│                                         │
│ LABEL                                   │
│ [File upload area]                      │
│ Preview image                           │
└─────────────────────────────────────────┘
```

### Layout Pattern
```
┌─────────────────────────────────────────┐
│ Header                                  │
│ - Title + Icon                          │
│ - Subtitle                              │
│ - Action button (top right)             │
├─────────────────────────────────────────┤
│ Content                                 │
│ - Cards with rounded-xl borders         │
│ - Slate-200 borders                     │
│ - White backgrounds                     │
│ - Consistent padding (p-5)              │
├─────────────────────────────────────────┤
│ Footer                                  │
│ - Navigation links                      │
│ - Secondary actions                     │
└─────────────────────────────────────────┘
```

---

## 🚦 Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Error Type          │ Handler              │ User Experience │
├─────────────────────────────────────────────────────────────┤
│ Form Validation     │ Zod + RHF            │ Inline errors   │
│ Network Error       │ TanStack Query       │ Error banner    │
│ 401 Unauthorized    │ API Client           │ Auto-logout     │
│ 404 Not Found       │ Component check      │ Fallback UI     │
│ 500 Server Error    │ TanStack Query       │ Error banner    │
│ File Upload Error   │ Try-catch            │ Error banner    │
│ Map Load Error      │ isMounted check      │ Loading state   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Design Breakpoints

```
Mobile First Approach:

Base (< 640px)
- Single column layouts
- Full-width buttons
- Stacked form sections
- h-[240px] map height

sm: (≥ 640px)
- Two-column grids where appropriate
- Inline buttons
- h-[300px] map height
- Larger text sizes

lg: (≥ 1024px)
- Two-column form layout (registration)
- Side-by-side sections
- Wider max-width containers
```

---

**Visual Reference**: All diagrams use ASCII art for universal compatibility
**Last Updated**: Current session
