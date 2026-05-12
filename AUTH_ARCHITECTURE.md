# TaxiMela Business Owner Web - Authentication Architecture

## Overview
Smart hybrid authentication system with automatic token refresh, 401 handling, and protected routes.

## Database Architecture
- **Single `users` table** with role flags: `is_commuter`, `is_business_owner`
- Same Firebase UID can have multiple roles
- Backend verifies Firebase ID tokens and manages user records
- User creation/role assignment via `/api/auth/register` endpoint

## Authentication Flows

### 1. Mobile Handoff Flow (Production)
```
Mobile App (authenticated) 
  → Generates handoff token via backend
  → Opens browser: /register?handoff=TOKEN
  → Web exchanges token for Firebase ID token
  → Stores in session store
  → User authenticated
```

**Implementation**: `src/app/register/registerClient.tsx`

### 2. Direct Login Flow (Testing)
```
User visits /login
  → Enters email/password
  → Firebase Authentication
  → Receives Firebase ID token
  → Stores in session store
  → Redirects to /registration
```

**Implementation**: `src/app/login/page.tsx`

## Core Components

### 1. AuthProvider (`src/lib/auth-provider.tsx`)
- Wraps entire app in `src/providers/app-providers.tsx`
- Uses Firebase `onAuthStateChanged` listener
- **Automatically refreshes tokens** before expiry (Firebase handles this)
- Updates session store with fresh tokens
- Provides `useAuth()` hook for auth state

### 2. ProtectedRoute Component
- Wraps pages requiring authentication
- Shows loading state while checking auth
- Redirects to `/login` if not authenticated
- Used in: `/registration`, `/status`, `/dashboard`, `/businesses/[id]`

### 3. Session Store (`src/store/session-store.ts`)
- Zustand store with localStorage persistence
- Stores: `ownerId` (Firebase UID), `accessToken` (Firebase ID token), `isAuthenticated`
- Methods: `setSession()`, `clearSession()`

### 4. API Client (`src/lib/api-client.ts`)
- Generic request utility with Bearer token auth
- **401 Interceptor**: Auto-clears session and redirects to `/login` on token expiry
- Handles all backend API calls

### 5. Firebase Utils (`src/lib/firebase.ts`)
- `signInWithEmail()` - Email/password login
- `signUpWithEmail()` - Account creation
- `signOutUser()` - Logout
- `getCurrentUser()` - Get current Firebase user
- `refreshToken()` - Manually refresh token (rarely needed)

## Token Management

### Automatic Refresh
- Firebase SDK automatically refreshes tokens every 55 minutes (tokens expire at 60 min)
- `onAuthStateChanged` listener updates session store with fresh token
- No manual refresh logic needed

### Token Expiry Handling
- If token expires (network issues, etc.), API returns 401
- API client intercepts 401, clears session, redirects to `/login`
- User must re-authenticate

## Protected Routes
All routes requiring authentication are wrapped with `ProtectedRoute`:
- `/registration` - Business registration form
- `/status` - Application status tracking
- `/dashboard` - Business dashboard
- `/businesses/[id]` - Business detail/edit

## Public Routes
- `/login` - Authentication page
- `/register` - Mobile handoff landing page

## Backend Integration
- All authenticated endpoints require: `Authorization: Bearer <firebase-token>`
- Backend verifies token with Firebase Admin SDK
- Backend extracts user UID and checks role flags
- Backend creates user record if doesn't exist (via `/api/auth/register`)

## Security Features
1. **Token Auto-Refresh**: Prevents expired token errors
2. **401 Auto-Logout**: Clears invalid sessions automatically
3. **Protected Routes**: Prevents unauthorized access
4. **localStorage Persistence**: Maintains session across page reloads
5. **Firebase Security**: Industry-standard authentication

## Usage Examples

### Accessing Auth State
```tsx
import { useAuth } from "@/lib/auth-provider";

function MyComponent() {
  const { isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Authenticated content</div>;
}
```

### Making Authenticated API Calls
```tsx
import { useSessionStore } from "@/store/session-store";
import { apiRequest } from "@/lib/api-client";

function MyComponent() {
  const accessToken = useSessionStore((s) => s.accessToken);
  
  const fetchData = async () => {
    const data = await apiRequest("/api/endpoint", {
      method: "GET",
      token: accessToken ?? "",
    });
  };
}
```

### Protecting a Page
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

### Manual Logout
```tsx
import { signOutUser } from "@/lib/firebase";
import { useSessionStore } from "@/store/session-store";
import { useRouter } from "next/navigation";

function LogoutButton() {
  const clearSession = useSessionStore((s) => s.clearSession);
  const router = useRouter();
  
  const handleLogout = async () => {
    await signOutUser();
    clearSession();
    router.push("/login");
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://taximela-backend-kxmi.onrender.com
```

## Firebase Config
- Project ID: `taximelafinal-db`
- API Key: `AIzaSyDq-F0DEMOXC0TjXY3PfjgUgktJg4TPQDw`
- Auth Domain: `taximelafinal-db.firebaseapp.com`

## Key Insights
1. **No manual token refresh needed** - Firebase SDK handles it automatically
2. **401 errors auto-logout** - No stale sessions
3. **Protected routes enforce auth** - No unauthorized access
4. **Single source of truth** - Session store synced with Firebase auth state
5. **Works with mobile handoff** - Seamless transition from mobile to web
