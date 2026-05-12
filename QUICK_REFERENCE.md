# TaxiMela Business Owner Web - Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

**Access**: http://localhost:3000

---

## 📍 Routes Quick Reference

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Public | Home page |
| `/login` | Public | Email/password authentication |
| `/register` | Public | Mobile handoff landing |
| `/registration` | Protected | Main registration form |
| `/status` | Protected | Application status tracking |
| `/dashboard` | Protected | Business overview |
| `/businesses/[id]` | Protected | Business detail/edit |

---

## 🔑 Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=https://taximela-backend-kxmi.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhp06qh1q
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=taximela
```

---

## 🎨 Color System

```typescript
// Primary colors
bg-indigo-600    // Metro Indigo (primary)
bg-orange-500    // Transit Orange (secondary)

// Status colors
bg-emerald-50    // Success background
bg-amber-50      // Warning background
bg-rose-50       // Error background
bg-sky-50        // Info background

// Neutrals
bg-slate-50      // Light background
bg-slate-900     // Dark text
border-slate-200 // Borders
```

---

## 📦 Common Imports

```typescript
// Auth
import { useAuth } from "@/lib/auth-provider";
import { ProtectedRoute } from "@/lib/auth-provider";
import { useSessionStore } from "@/store/session-store";

// API
import { apiRequest } from "@/lib/api-client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import * as api from "@/features/registration/api/registration";

// Forms
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Data fetching
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Navigation
import { useRouter } from "next/navigation";
import Link from "next/link";
```

---

## 🔐 Auth Patterns

### Get Current User Token
```typescript
const accessToken = useSessionStore((s) => s.accessToken);
```

### Check Auth State
```typescript
const { isLoading, isAuthenticated } = useAuth();
```

### Protect a Page
```typescript
export default function MyPage() {
  return (
    <ProtectedRoute>
      <MyPageContent />
    </ProtectedRoute>
  );
}
```

### Logout
```typescript
import { signOutUser } from "@/lib/firebase";
import { useSessionStore } from "@/store/session-store";

const clearSession = useSessionStore((s) => s.clearSession);
await signOutUser();
clearSession();
router.push("/login");
```

---

## 🌐 API Patterns

### GET Request
```typescript
const { data, isLoading, isError } = useQuery({
  queryKey: ["my-key"],
  queryFn: () => apiRequest("/api/endpoint", { token: accessToken ?? "" }),
  enabled: !!accessToken,
});
```

### POST Request
```typescript
const mutation = useMutation({
  mutationFn: async (payload) => {
    return apiRequest("/api/endpoint", {
      method: "POST",
      body: payload,
      token: accessToken ?? "",
    });
  },
  onSuccess: () => {
    // Handle success
  },
});

// Use it
mutation.mutate({ key: "value" });
```

### PATCH Request
```typescript
const mutation = useMutation({
  mutationFn: async (payload) => {
    return apiRequest(`/api/endpoint/${id}`, {
      method: "PATCH",
      body: payload,
      token: accessToken ?? "",
    });
  },
});
```

---

## 📤 File Upload Pattern

```typescript
// 1. Upload to Cloudinary
const url = await uploadToCloudinary(file);

// 2. Send URL to backend
await apiRequest("/api/endpoint", {
  method: "POST",
  body: { photo_url: url },
  token: accessToken ?? "",
});
```

---

## 📝 Form Patterns

### Basic Form Setup
```typescript
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: "", email: "" },
});

const onSubmit = (values: FormValues) => {
  console.log(values);
};
```

### File Input with Controller
```typescript
<Controller
  control={control}
  name="photo"
  render={({ field }) => (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) field.onChange(file);
      }}
    />
  )}
/>
```

### Map Location Picker
```typescript
<Controller
  control={control}
  name="locationLat"
  render={({ field: latField }) => (
    <Controller
      control={control}
      name="locationLng"
      render={({ field: lngField }) => (
        <LocationPickerMap
          latitude={latField.value}
          longitude={lngField.value}
          onPick={(lat, lng) => {
            latField.onChange(lat);
            lngField.onChange(lng);
          }}
        />
      )}
    />
  )}
/>
```

---

## 🗺️ Map Component

### Import (Dynamic)
```typescript
const LocationPickerMap = dynamic(
  () => import("@/features/registration/components/location-picker-map")
    .then((m) => m.LocationPickerMap),
  { ssr: false }
);
```

### Usage
```typescript
<LocationPickerMap
  latitude={9.03}
  longitude={38.74}
  onPick={(lat, lng) => console.log(lat, lng)}
/>
```

---

## 🎨 Common UI Patterns

### Input Field
```typescript
const fieldClassName = "mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 sm:text-sm";

<input className={fieldClassName} {...register("name")} />
```

### Label
```typescript
const labelClassName = "text-xs font-semibold tracking-[0.14em] text-slate-500";

<label className={labelClassName}>FIELD NAME</label>
```

### Primary Button
```typescript
<button className="h-11 rounded-lg bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">
  Submit
</button>
```

### Status Badge
```typescript
<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
  Approved
</span>
```

### Card Container
```typescript
<div className="rounded-xl border border-slate-200 bg-white p-5">
  {/* Content */}
</div>
```

---

## 🔍 Debugging Tips

### Check Auth State
```typescript
// In component
const session = useSessionStore();
console.log("Session:", session);

// In browser console
localStorage.getItem("owner-session")
```

### Check API Errors
```typescript
const mutation = useMutation({
  mutationFn: myApiCall,
  onError: (error) => {
    console.error("API Error:", error);
    if (error instanceof ApiError) {
      console.log("Status:", error.status);
      console.log("Code:", error.code);
    }
  },
});
```

### Check Form Errors
```typescript
const { formState: { errors } } = useForm();
console.log("Form errors:", errors);
```

### Check Query State
```typescript
const query = useQuery({ ... });
console.log("Loading:", query.isLoading);
console.log("Error:", query.isError);
console.log("Data:", query.data);
```

---

## 🐛 Common Issues & Fixes

### Issue: Leaflet map not loading
**Fix**: Ensure dynamic import with `ssr: false`
```typescript
const Map = dynamic(() => import("./map"), { ssr: false });
```

### Issue: 401 errors on API calls
**Fix**: Check token in session store
```typescript
const accessToken = useSessionStore((s) => s.accessToken);
console.log("Token:", accessToken);
```

### Issue: Form not submitting
**Fix**: Check validation errors
```typescript
const { formState: { errors } } = useForm();
console.log(errors);
```

### Issue: File upload failing
**Fix**: Check file size (max 5MB) and Cloudinary config
```typescript
if (file.size > 5 * 1024 * 1024) {
  console.error("File too large");
}
```

### Issue: Protected route not redirecting
**Fix**: Ensure AuthProvider wraps app in layout.tsx
```typescript
// layout.tsx
<AuthProvider>
  <QueryClientProvider>
    {children}
  </QueryClientProvider>
</AuthProvider>
```

---

## 📊 API Endpoints Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | Yes | Create/update user |
| POST | `/api/auth/exchange-handoff-token` | No | Exchange handoff token |
| GET | `/api/business-categories` | No | Get categories |
| POST | `/api/business-registrations` | Yes | Submit registration |
| GET | `/api/business-registrations` | Yes | Get applications |
| GET | `/api/business-registrations/{id}` | Yes | Get application |
| GET | `/api/businesses/dashboard-summary` | Yes | Get stats |
| GET | `/api/businesses` | Yes | Get businesses |
| GET | `/api/businesses/{id}` | Yes | Get business |
| PATCH | `/api/businesses/{id}` | Yes | Update business |

---

## 🧪 Testing Checklist

### Registration Flow
- [ ] Login with email/password
- [ ] Fill all form fields
- [ ] Upload valid documents (< 5MB)
- [ ] Pin location on map
- [ ] Submit form
- [ ] Check /status for pending application

### Dashboard Flow
- [ ] View summary stats
- [ ] See approved businesses
- [ ] Click business to view details
- [ ] Edit business details
- [ ] Upload new logo
- [ ] Save changes

### Auth Flow
- [ ] Login persists on page reload
- [ ] Protected routes redirect to /login
- [ ] 401 errors trigger logout
- [ ] Token refreshes automatically

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/auth-provider.tsx` | Auth state management |
| `src/lib/api-client.ts` | API request utility |
| `src/lib/firebase.ts` | Firebase config |
| `src/lib/cloudinary.ts` | File upload |
| `src/store/session-store.ts` | Session state |
| `src/features/registration/api/registration.ts` | All API functions |
| `src/app/registration/page.tsx` | Main form |
| `src/app/globals.css` | Color system |

---

## 🎯 Next Steps for New Features

### Add New Page
1. Create file in `src/app/[route]/page.tsx`
2. Wrap with `<ProtectedRoute>` if auth required
3. Add navigation links

### Add New API Endpoint
1. Add function to `src/features/registration/api/registration.ts`
2. Use `apiRequest` utility
3. Add TypeScript types

### Add New Form Field
1. Update Zod schema
2. Add to defaultValues
3. Add input to JSX
4. Update API payload type

### Add New Component
1. Create in `src/features/[feature]/components/`
2. Export from component file
3. Import where needed

---

## 💡 Pro Tips

1. **Use TanStack Query** for all server state (auto-caching, refetching)
2. **Use Zustand** for client state (simple, no boilerplate)
3. **Dynamic import maps** to prevent SSR errors
4. **Validate on client** before API calls (better UX)
5. **Upload to Cloudinary first** then send URLs to backend
6. **Use TypeScript** for all API responses (type safety)
7. **Check auth state** before making API calls
8. **Invalidate queries** after mutations (fresh data)

---

**Quick Links**:
- [Full Codebase Overview](./CODEBASE_OVERVIEW.md)
- [Auth Architecture](./AUTH_ARCHITECTURE.md)
- [Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md)
- [Next.js Docs](https://nextjs.org/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
