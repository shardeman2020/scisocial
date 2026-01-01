# Pre-Deployment Fixes Required

Before deploying to production, these TypeScript issues need to be fixed:

## Issues Found

### 1. ✅ Backend Build - FIXED
- **Issue:** `mediaUrls` vs `images` property mismatch in post.controller.ts
- **Status:** Fixed
- **Location:** `backend/src/modules/post/post.controller.ts:52`

### 2. ✅ Dashboard TypeScript - FIXED
- **Issue:** Set<unknown> type inference
- **Status:** Fixed
- **Location:** `frontend/app/dashboard/page.tsx:90`

### 3. ✅ Main Page TypeScript - FIXED
- **Issue:** Multiple Set<unknown> type inferences
- **Status:** Fixed
- **Locations:**
  - `frontend/app/page.tsx:147`
  - `frontend/app/page.tsx:160`

### 4. ✅ Citation Interface - FIXED
- **Issue:** Missing `abstract` property
- **Status:** Fixed - added optional property
- **Location:** `frontend/app/page.tsx:9-21`

### 5. ⚠️ Onboarding Page - NEEDS FIX
- **Issue:** `useSearchParams()` needs Suspense boundary
- **Error:** `useSearchParams() should be wrapped in a suspense boundary at page "/onboarding"`
- **Location:** `frontend/app/onboarding/page.tsx`
- **Fix Required:**

```tsx
import { Suspense } from 'react'

function OnboardingContent() {
  const searchParams = useSearchParams()
  // ... rest of component
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
```

### 6. TODO: Post-Topics Relationship
- **Issue:** Post interface missing `topics` relationship
- **Status:** Commented out for now
- **Location:** `frontend/app/page.tsx:127-130`
- **Fix Required:** Add topics relationship to Post entity in backend

## How to Fix Before Deployment

### Option 1: Fix Now (Recommended)
```bash
# Fix the onboarding Suspense issue
# Edit frontend/app/onboarding/page.tsx following the pattern above

# Then rebuild
cd frontend
npm run build

cd ../backend
npm run build
```

### Option 2: Deploy Development Build (Not Recommended)
You can deploy the current development code without production build, but this is not ideal for performance.

## Backend is Ready ✅

The backend builds successfully and is ready to deploy:
```bash
cd backend
npm run build  # ✅ Success
```

## Once Fixed

After fixing the onboarding Suspense issue, you can proceed with deployment using:
```bash
./deploy.sh
```

Or follow the deployment guides:
- `QUICK_DEPLOY.md` - 5-minute quickstart
- `DEPLOYMENT_GUIDE.md` - Complete guide
