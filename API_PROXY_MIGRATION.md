# API Proxy Migration Guide

## ✅ What Was Done

Created a Next.js API proxy to mask the actual API endpoint (`https://gorro.online`) with your Vercel deployment URL.

### Files Created:

1. **`src/app/api/proxy/[...path]/route.ts`** - Catch-all API route that proxies all requests
2. **`src/lib/api.ts`** - Utility file with `getApiUrl()` helper function

### How It Works:

**Before:**
```
Browser → https://gorro.online/admin/users
```

**After:**
```
Browser → https://gorro-customer-support.vercel.app/api/proxy/admin/users
          ↓
          Next.js Proxy
          ↓  
          https://gorro.online/admin/users
```

The browser's Network tab will only show:
- `https://gorro-customer-support.vercel.app/api/proxy/...`

### Usage:

Instead of:
```typescript
const response = await fetch("https://gorro.online/admin/users", {...});
```

Use:
```typescript
import { getApiUrl } from "@/lib/api";

const response = await fetch(getApiUrl("admin/users"), {...});
```

## ✅ Files Already Updated:

1. ✅ `src/app/dashboard/customers/[id]/page.tsx`
2. ✅ `src/app/dashboard/customers/page.tsx`

## 📝 Files Still Need Update:

### 1. src/app/page.tsx (Login Page)
```typescript
// Add import
import { getApiUrl } from "@/lib/api";

// Change line 19:
const response = await fetch(getApiUrl("auth/login"), {
```

### 2. src/app/dashboard/page.tsx (Dashboard/Tickets)
```typescript
// Add import
import { getApiUrl } from "@/lib/api";

// Change line 42-43:
const endpoint = action === "accept"
  ? getApiUrl(`tickets/${ticketId}/accept`)
  : getApiUrl(`tickets/${ticketId}/close`);

// Change line 86:
const response = await fetch(getApiUrl("tickets"), {
```

### 3. src/app/dashboard/marketing/page.tsx
```typescript
// Add import
import { getApiUrl } from "@/lib/api";

// Change line 38:
const response = await fetch(getApiUrl("admin/marketing/segments"), {

// Change line 80:
const response = await fetch(getApiUrl(`admin/marketing/segments/${segmentKey}/export`), {
```

### 4. src/app/dashboard/marketing/[segment]/page.tsx
```typescript
// Add import
import { getApiUrl } from "@/lib/api";

// Change line 70:
const response = await fetch(getApiUrl(`admin/marketing/segments/${segmentKey}?${params}`), {

// Change line 114:
const response = await fetch(getApiUrl(`admin/marketing/segments/${segmentKey}/export`), {
```

### 5. src/app/dashboard/customers/[id]/page.tsx - Additional Updates
```typescript
// Already has import, just update remaining URLs:

// Line 89:
const response = await fetch(getApiUrl(`wallet/main/${customerId}`), {

// Line 127:
const response = await fetch(getApiUrl("admin/users/virtual-account-providers"), {
```

## 🚀 Benefits:

1. **Security**: Actual API endpoint is hidden
2. **Professional**: Network tab shows your domain
3. **Flexibility**: Easy to change backend URL in one place
4. **CORS**: Easier CORS management
5. **Logging**: Can add logging/analytics in proxy layer

## ⚠️ Note:

The metadata URLs in `src/app/layout.tsx` should stay as `https://gorro.online` since those are for SEO/Open Graph tags, not API calls.

## 🧪 Testing:

After deployment, check browser Network tab:
- All requests should show: `https://gorro-customer-support.vercel.app/api/proxy/...`
- NO requests should show: `https://gorro.online/...`

