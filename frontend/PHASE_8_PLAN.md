# Phase 8: Loading States & UX Improvements

## Current Status

✅ **Completed:**
- Toast notifications with custom styling
- Error handling with user-friendly messages

❌ **Pending:**
- Skeleton loaders (currently using basic "Loading..." text)
- Token refresh mechanism
- Real-time updates/polling

---

## Priority 1: Skeleton Loaders (High Impact, Quick Win)

### Why First?
- **High visual impact** - Makes app feel more professional
- **Quick to implement** - 2-3 hours
- **Immediate UX improvement** - Users see content structure while loading

### Implementation Plan

#### 1. Create Reusable Skeleton Components

**Files to create:**
- `frontend/src/components/skeletons/PostSkeleton.jsx`
- `frontend/src/components/skeletons/CommentSkeleton.jsx`
- `frontend/src/components/skeletons/MarketplaceItemSkeleton.jsx`
- `frontend/src/components/skeletons/BusinessSkeleton.jsx`
- `frontend/src/components/skeletons/ProfileSkeleton.jsx`

#### 2. Replace Loading States

**Pages to update:**
- `FeedPage.jsx` - Replace "Loading posts..." with PostSkeleton
- `CommentDrawer.jsx` - Add CommentSkeleton for loading comments
- `MarketplacePage.jsx` - Replace with MarketplaceItemSkeleton
- `BusinessPage.jsx` - Replace with BusinessSkeleton
- `ProfilePage.jsx` - Replace with ProfileSkeleton

#### 3. Skeleton Design
- Match actual content structure
- Use shimmer animation (CSS or Tailwind)
- Black/white theme consistent with app
- Subtle pulse animation

**Estimated Time:** 2-3 hours

---

## Priority 2: Token Refresh (Security & UX)

### Why Second?
- **Security** - Prevents users from being logged out unexpectedly
- **Better UX** - Seamless session management
- **Production ready** - Essential for production deployment

### Implementation Plan

#### 1. Create Token Refresh Utility

**File to create:**
- `frontend/src/utils/tokenRefresh.js`

**Features:**
- Check token expiration
- Refresh token before expiration (e.g., 5 minutes before)
- Handle refresh errors gracefully
- Update store with new tokens

#### 2. Add Refresh Endpoint Integration

**Backend endpoint needed:**
- `POST /api/v1/auth/refresh` (if not exists)

#### 3. Auto-refresh Setup

**Implementation:**
- Use `useEffect` in App.jsx or Layout.jsx
- Set interval to check token expiration
- Refresh automatically in background
- Show toast if refresh fails (user needs to re-login)

**Estimated Time:** 2-3 hours

---

## Priority 3: Real-time Updates (Better UX)

### Why Third?
- **Nice to have** - App works without it
- **Better engagement** - Users see new content automatically
- **More complex** - Requires polling or WebSocket setup

### Implementation Plan

#### Option A: Polling (Simpler)
- Use React Query's `refetchInterval`
- Poll every 30-60 seconds for new posts/comments
- Show indicator when new content is available
- "Pull to refresh" functionality

#### Option B: WebSocket (Advanced)
- Supabase Realtime subscriptions
- Real-time post/comment updates
- More complex but better UX

**Recommended:** Start with Option A (Polling)

**Estimated Time:** 3-4 hours

---

## Implementation Order

### Week 1: Quick Wins
1. ✅ Toast notifications (DONE)
2. **Skeleton loaders** (2-3 hours) ← **START HERE**
3. Token refresh (2-3 hours)

### Week 2: Enhanced Features
4. Real-time updates (3-4 hours)
5. Pull-to-refresh (1-2 hours)
6. Optimistic updates (2-3 hours)

---

## Quick Start: Skeleton Loaders

### Step 1: Create Base Skeleton Component

```jsx
// frontend/src/components/skeletons/BaseSkeleton.jsx
export default function BaseSkeleton({ className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2"></div>
    </div>
  )
}
```

### Step 2: Create PostSkeleton

```jsx
// frontend/src/components/skeletons/PostSkeleton.jsx
export default function PostSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex gap-4">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  )
}
```

### Step 3: Use in FeedPage

```jsx
if (isLoading) {
  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  )
}
```

---

## Success Metrics

After implementing:
- ✅ Professional loading experience
- ✅ Users understand content is loading
- ✅ Reduced perceived load time
- ✅ Better user engagement
- ✅ Production-ready authentication

---

## Next Phase Preview

After Phase 8, consider:
- **Phase 9:** Social Features (likes, reactions, shares)
- **Phase 10:** Marketplace Enhancements (favorites, ratings)
- **Phase 11:** Communication Features (messaging, events)

