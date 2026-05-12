# TaxiMela Business Owner Web - Complete Codebase Overview

## 📋 Project Summary
**Next.js 16** web application for TaxiMela business owners to register their businesses, track application status, and manage approved businesses. Integrates with FastAPI backend and Firebase authentication.

## 🎯 Core Purpose
Enable business owners to:
1. Register their business with government verification
2. Track registration application status
3. Manage approved businesses (view/edit details)
4. Upload documents to Cloudinary
5. Pin business location on interactive map

---

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (session), TanStack Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Firebase Auth
- **Maps**: Leaflet + React Leaflet
- **File Upload**: Cloudinary (unsigned preset)
- **Backend API**: FastAPI (https://taximela-backend-kxmi.onrender.com)

### Design System
**TaxiMela Brand Colors:**
- Primary: Metro Indigo `#4F46E5`
- Secondary: Transit Orange `#F97316`
- Neutrals: Slate palette
- Semantic: Success (emerald), Warning (amber), Error (rose), Info (sky)

---

## 📁 Project Structure

```
owner-web/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── businesses/[id]/      # Business detail/edit page
│   │   ├── dashboard/            # Business dashboard
│   │   ├── login/                # Firebase email/password login
│   │   ├── register/             # Mobile handoff landing page
│   │   ├── registration/         # Main registration form
│   │   ├── status/               # Application status tracking
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── globals.css           # TaxiMela color system + Tailwind
│   │   └── page.tsx              # Home page
│   │
│   ├── features/                 # Feature-based modules
│   │   ├── auth/api/             # Auth API functions
│   │   └── registration/
│   │       ├── api/              # Registration API functions
│   │       └── components/       # Location picker map
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── api-client.ts         # Generic API request utility
│   │   ├── auth-provider.tsx     # Firebase auth state management
│   │   ├── cloudinary.ts         # File upload utility
│   │   └── firebase.ts           # Firebase config & auth functions
│   │
│   ├── providers/                # React context providers
│   │   └── app-providers.tsx     # AuthProvider + QueryClientProvider
│   │
│   └── store/                    # Global state
│       └── session-store.ts      # Zustand session store (localStorage)
│
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── AUTH_ARCHITECTURE.md          # Auth system documentation
└── README.md                     # Project setup instructions
```

---

## 🔐 Authentication System

### Two Authentication Flows

#### 1. Mobile Handoff (Production)
```
Mobile App → Backend generates handoff token → Opens /register?handoff=TOKEN
  → Web exchanges token for Firebase ID token → Stores in session → Authenticated
```

#### 2. Direct Login (Testing)
```
User visits /login → Email/password → Firebase Auth → Stores token → Redirects to /registration
```

### Key Components
- **AuthProvider**: Firebase `onAuthStateChanged` listener, auto-refreshes tokens
- **ProtectedRoute**: Wraps pages requiring auth, redirects to `/login` if not authenticated
- **Session Store**: Zustand store with localStorage persistence (`ownerId`, `accessToken`, `isAuthenticated`)
- **401 Interceptor**: API client auto-clears session on token expiry

### Protected Routes
- `/registration` - Business registration form
- `/status` - Application status
- `/dashboard` - Business dashboard
- `/businesses/[id]` - Business detail/edit

### Public Routes
- `/login` - Authentication page
- `/register` - Mobile handoff landing

---

## 🗄️ Backend Integration

### API Base URL
`https://taximela-backend-kxmi.onrender.com`

### Database Schema Insights
- **users table**: Single table with `is_commuter` and `is_business_owner` flags
- **business_registrations table**: Stores applications with status (pending_review, approved, rejected)
- **businesses table**: Approved businesses only
- **business_categories table**: Service categories (e.g., Restaurant, Hotel, Taxi)

### API Endpoints (8 total)

#### Authentication
- `POST /api/auth/register` - Create/update user with business_owner role
- `POST /api/auth/exchange-handoff-token` - Exchange handoff token for Firebase token

#### Business Registration
- `POST /api/business-registrations` - Submit new registration
- `GET /api/business-registrations` - Get user's applications
- `GET /api/business-registrations/{id}` - Get single application

#### Business Management
- `GET /api/businesses/dashboard-summary` - Get stats (total, pending, approved, rejected)
- `GET /api/businesses` - Get user's approved businesses
- `GET /api/businesses/{id}` - Get business details
- `PATCH /api/businesses/{id}` - Update business

#### Reference Data
- `GET /api/business-categories` - Get all categories

### Authentication Header
All authenticated endpoints require:
```
Authorization: Bearer <firebase-id-token>
```

---

## 📄 Page-by-Page Breakdown

### 1. `/register` - Mobile Handoff Landing
**File**: `src/app/register/page.tsx` + `registerClient.tsx`

**Purpose**: Receive handoff token from mobile app, exchange for Firebase token

**Flow**:
1. Mobile app opens browser with `?handoff=TOKEN`
2. Client component extracts token from URL
3. Calls backend `/api/auth/exchange-handoff-token`
4. Stores Firebase token in session store
5. Redirects to `/registration`

**Fallback**: If no handoff token, shows link to `/registration`

---

### 2. `/login` - Direct Login (Testing)
**File**: `src/app/login/page.tsx`

**Purpose**: Email/password authentication for testing without mobile app

**Features**:
- Toggle between Sign In / Sign Up
- Firebase email/password authentication
- Stores token in session store
- Redirects to `/registration`

**Form Fields**:
- Email (required)
- Password (required)

---

### 3. `/registration` - Main Registration Form
**File**: `src/app/registration/page.tsx`

**Purpose**: Submit business registration application

**Form Sections** (4 sections):

#### Section 1: Owner Verification
- **National ID Number**: 12-digit validation
- **National ID Photo**: Upload (max 5MB)

#### Section 2: Business Verification
- **Business Name**: Text input
- **Business License Photo**: Upload (max 5MB)

#### Section 3: Business Details
- **Category**: Dropdown (fetched from backend)

#### Section 4: Service Location
- **Interactive Map**: Click to pin location (Leaflet)
- Stores latitude/longitude

**Validation**: Zod schema with React Hook Form

**Submission Flow**:
1. Validate form
2. Upload photos to Cloudinary (parallel)
3. Submit to backend with photo URLs
4. Redirect to `/status` on success

**API Payload**:
```typescript
{
  business_name: string,
  category_id: string,
  latitude: number,
  longitude: number,
  government_id_fan: string,        // 12-digit National ID
  government_id_photo_url: string,  // Cloudinary URL
  business_license_photo_url: string // Cloudinary URL
}
```

---

### 4. `/status` - Application Status Tracking
**File**: `src/app/status/page.tsx`

**Purpose**: View all registration applications and their status

**Features**:
- Fetches from `GET /api/business-registrations`
- Displays list of applications with status badges
- Shows rejection reason if rejected
- Link to create new registration

**Status Types**:
- **Pending Review**: Amber badge
- **Approved**: Emerald badge
- **Rejected**: Rose badge with rejection reason

---

### 5. `/dashboard` - Business Dashboard
**File**: `src/app/dashboard/page.tsx`

**Purpose**: Overview of all businesses and applications

**Features**:
- **Summary Stats** (4 cards):
  - Total Applications
  - Pending
  - Approved
  - Rejected
- **Businesses List**: Approved businesses only
- Click business to view details

**Data Sources**:
- `GET /api/businesses/dashboard-summary` - Stats
- `GET /api/businesses` - Approved businesses list

---

### 6. `/businesses/[id]` - Business Detail/Edit
**File**: `src/app/businesses/[id]/page.tsx`

**Purpose**: View and edit approved business details

**Features**:
- **View Mode**: Display business info, documents, location
- **Edit Mode**: Inline editing with form
- **Editable Fields**:
  - Business Name
  - Category
  - Location (interactive map)
  - Business Logo (optional upload)

**Submission Flow**:
1. Validate form
2. Upload logo to Cloudinary (if provided)
3. PATCH to backend
4. Invalidate queries to refresh data

**API Payload**:
```typescript
{
  business_name: string,
  category_id: string,
  latitude: number,
  longitude: number,
  business_logo?: string  // Cloudinary URL
}
```

---

## 🧩 Key Components

### LocationPickerMap
**File**: `src/features/registration/components/location-picker-map.tsx`

**Purpose**: Interactive map for selecting business location

**Features**:
- Leaflet map with OpenStreetMap tiles
- Click to pin location
- Displays selected location with Metro Indigo marker
- SSR-safe with client-side mount check
- Default center: Addis Ababa (9.03, 38.74)

**Props**:
```typescript
{
  latitude: number | null,
  longitude: number | null,
  onPick: (lat: number, lng: number) => void
}
```

**Usage**: Dynamically imported with `ssr: false` to prevent hydration errors

---

## 🔧 Utilities & Libraries

### 1. API Client (`src/lib/api-client.ts`)
Generic request utility for backend API calls

**Features**:
- Automatic Bearer token injection
- JSON serialization
- Error handling with ApiError class
- 401 interceptor (auto-logout on token expiry)

**Usage**:
```typescript
const data = await apiRequest<ResponseType>("/api/endpoint", {
  method: "POST",
  body: { key: "value" },
  token: accessToken
});
```

---

### 2. Cloudinary Upload (`src/lib/cloudinary.ts`)
File upload utility using unsigned preset

**Configuration**:
- Cloud Name: `dhp06qh1q`
- Upload Preset: `taximela`
- Asset Folder: `taximela_owner`
- Auto-generates unguessable public IDs

**Usage**:
```typescript
const url = await uploadToCloudinary(file);
// Returns: https://res.cloudinary.com/dhp06qh1q/image/upload/v123/taximela_owner/abc123.jpg
```

---

### 3. Firebase Auth (`src/lib/firebase.ts`)
Firebase configuration and auth functions

**Config**:
- Project ID: `taximelafinal-db`
- API Key: `AIzaSyDq-F0DEMOXC0TjXY3PfjgUgktJg4TPQDw`

**Functions**:
- `signInWithEmail(email, password)` - Login
- `signUpWithEmail(email, password)` - Register
- `signOutUser()` - Logout
- `getCurrentUser()` - Get current user
- `refreshToken()` - Manual token refresh

---

### 4. Session Store (`src/store/session-store.ts`)
Zustand store with localStorage persistence

**State**:
```typescript
{
  ownerId: string | null,        // Firebase UID
  accessToken: string | null,    // Firebase ID token
  isAuthenticated: boolean
}
```

**Methods**:
- `setSession({ ownerId, accessToken })` - Store auth data
- `clearSession()` - Clear auth data

**Persistence**: Syncs to `localStorage` under key `owner-session`

---

### 5. Registration API (`src/features/registration/api/registration.ts`)
All backend API functions

**Functions**:
- `submitBusinessRegistration(payload, token)` - POST registration
- `getMyApplications(token)` - GET applications
- `getMyApplication(token, id)` - GET single application
- `getBusinessCategories()` - GET categories (public)
- `getDashboardSummary(token)` - GET stats
- `getMyBusinesses(token)` - GET approved businesses
- `getBusinessById(token, id)` - GET business details
- `updateBusiness(token, id, payload)` - PATCH business

---

## 🎨 Styling System

### Tailwind Configuration
**File**: `src/app/globals.css`

**CSS Variables** (TaxiMela Brand):
```css
--primary: #4f46e5;      /* Metro Indigo */
--secondary: #f97316;    /* Transit Orange */
--success: #10b981;      /* Emerald */
--warning: #f59e0b;      /* Amber */
--error: #ef4444;        /* Rose */
--info: #0ea5e9;         /* Sky */
```

**Slate Palette** (Neutrals):
- 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950

**Common Patterns**:
```typescript
// Input field
const fieldClassName = "mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 sm:text-sm";

// Label
const labelClassName = "text-xs font-semibold tracking-[0.14em] text-slate-500";

// Primary button
className="h-11 rounded-lg bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700"
```

---

## 🔄 Data Flow

### Registration Flow (Complete)
```
User fills form
  ↓
Validates with Zod schema
  ↓
Uploads photos to Cloudinary (parallel)
  ↓
Submits to backend with photo URLs
  ↓
Backend creates business_registration record (status: pending_review)
  ↓
Redirects to /status
  ↓
Admin reviews in admin panel
  ↓
If approved → Creates business record
  ↓
User sees approved business in /dashboard
```

### Auth Token Flow
```
User authenticates (login or handoff)
  ↓
Firebase returns ID token (60 min expiry)
  ↓
Stored in session store (localStorage)
  ↓
AuthProvider listens to Firebase auth state
  ↓
Firebase SDK auto-refreshes token at 55 min
  ↓
AuthProvider updates session store
  ↓
All API calls use fresh token from store
  ↓
If 401 error → Auto-logout → Redirect to /login
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm/yarn/pnpm

### Installation
```bash
npm install
```

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://taximela-backend-kxmi.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhp06qh1q
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=taximela
```

### Development
```bash
npm run dev
# Opens http://localhost:3000
```

### Build
```bash
npm run build
npm start
```

---

## 🧪 Testing Workflow

### Without Mobile App
1. Visit `http://localhost:3000/login`
2. Sign up with email/password
3. Redirects to `/registration`
4. Fill form and submit
5. Check status at `/status`
6. View dashboard at `/dashboard`

### With Mobile App
1. Mobile app authenticates user
2. Generates handoff token via backend
3. Opens browser: `http://localhost:3000/register?handoff=TOKEN`
4. Web exchanges token and redirects to `/registration`
5. Continue as above

---

## 📊 Database Schema Reference

### business_registrations
```sql
id                        UUID PRIMARY KEY
user_id                   UUID FK → users.id
business_name             VARCHAR
latitude                  DECIMAL
longitude                 DECIMAL
government_id_fan         VARCHAR(12)  -- National ID
government_id_photo_url   TEXT
business_license_photo_url TEXT
status                    ENUM (pending_review, approved, rejected)
rejection_reason          TEXT
reviewed_by               UUID FK → admins.id
category_id               UUID FK → business_categories.id
reviewed_at               TIMESTAMP
created_at                TIMESTAMP
updated_at                TIMESTAMP
```

### businesses
```sql
id                        UUID PRIMARY KEY
user_id                   UUID FK → users.id
name                      VARCHAR
category_id               UUID FK → business_categories.id
latitude                  DECIMAL
longitude                 DECIMAL
government_id_photo_url   TEXT
license_photo_url         TEXT
business_logo             TEXT (optional)
status                    ENUM (active, suspended)
approved_at               TIMESTAMP
created_at                TIMESTAMP
updated_at                TIMESTAMP
```

### users
```sql
id                        UUID PRIMARY KEY
firebase_uid              VARCHAR UNIQUE
email                     VARCHAR
is_commuter               BOOLEAN
is_business_owner         BOOLEAN
created_at                TIMESTAMP
updated_at                TIMESTAMP
```

---

## 🔑 Key Insights

1. **Single User Table**: Backend uses role flags instead of separate tables
2. **Two-Stage Process**: Registration → Admin Review → Business Creation
3. **Cloudinary Unsigned Upload**: No backend involvement for file uploads
4. **Firebase Token Auto-Refresh**: No manual refresh logic needed
5. **Protected Routes**: All auth-required pages wrapped with ProtectedRoute
6. **401 Auto-Logout**: Prevents stale sessions
7. **Mobile Handoff**: Seamless transition from mobile to web
8. **TaxiMela Brand Colors**: Metro Indigo primary, Transit Orange secondary

---

## 📚 Additional Documentation

- **AUTH_ARCHITECTURE.md** - Detailed auth system documentation
- **README.md** - Next.js setup instructions

---

## 🛠️ Common Tasks

### Add New Protected Page
```tsx
import { ProtectedRoute } from "@/lib/auth-provider";

export default function MyPage() {
  return (
    <ProtectedRoute>
      <MyPageContent />
    </ProtectedRoute>
  );
}
```

### Make Authenticated API Call
```tsx
import { useSessionStore } from "@/store/session-store";
import { apiRequest } from "@/lib/api-client";

const accessToken = useSessionStore((s) => s.accessToken);
const data = await apiRequest("/api/endpoint", {
  method: "GET",
  token: accessToken ?? ""
});
```

### Add New Form Field
1. Update Zod schema
2. Add to defaultValues
3. Add input to JSX
4. Update API payload type

### Upload File to Cloudinary
```tsx
import { uploadToCloudinary } from "@/lib/cloudinary";

const url = await uploadToCloudinary(file);
```

---

## 🎯 Project Status

✅ **Completed Features**:
- Firebase authentication (login + mobile handoff)
- Business registration form with validation
- Document upload to Cloudinary
- Interactive location picker map
- Application status tracking
- Business dashboard with stats
- Business detail/edit page
- Protected routes with auto-logout
- Automatic token refresh
- TaxiMela brand color system

🚧 **Future Enhancements** (if needed):
- Logout button in UI
- Profile page
- Business analytics
- Push notifications
- Multi-language support

---

**Last Updated**: Current session
**Version**: 0.1.0
**Framework**: Next.js 16.1.6
**Backend**: FastAPI (Render deployment)
