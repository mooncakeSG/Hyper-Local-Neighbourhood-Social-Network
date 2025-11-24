# Frontend-Backend Integration Notes

## ✅ Completed Integration

### 1. Neighbourhood Selection Page
- **Status**: ✅ Complete with dev mode support
- **Dev Mode**: Bypasses API call, directly sets neighbourhood in store
- **Production**: Uses `/api/v1/users/neighbourhood` endpoint
- **Features**: GPS location, manual search, list selection

### 2. Feed Page
- **Status**: ✅ Updated to use backend API
- **Dev Mode**: Returns mock posts for testing
- **Production**: Uses `/api/v1/posts?neighbourhood_id={id}` endpoint
- **Features**: Fetches posts, displays in feed, supports refetch

### 3. Post Composer
- **Status**: ✅ Updated to use backend API
- **Dev Mode**: Bypasses API call, logs to console
- **Production**: Uses `POST /api/v1/posts` endpoint
- **Features**: Creates posts and alerts, handles errors

### 4. Comment Drawer
- **Status**: ✅ Updated to use backend API
- **Dev Mode**: Returns mock comments, bypasses API on create
- **Production**: 
  - Fetches: `GET /api/v1/comments/post/{post_id}`
  - Creates: `POST /api/v1/comments`
- **Features**: Displays comments, creates new comments

---

## 🔧 Dev Mode Implementation

### How Dev Mode Works

1. **Detection**: Checks if `user.id` starts with `'dev-user-'` or `neighbourhood.id` starts with `'dev-neighbourhood-'`

2. **Bypass Strategy**:
   - **Neighbourhood Selection**: Directly sets neighbourhood in Zustand store
   - **Feed**: Returns mock data array
   - **Post Creation**: Logs to console, calls `onSuccess()` callback
   - **Comment Creation**: Logs to console, refetches mock data

3. **Benefits**:
   - No backend required for local development
   - Fast iteration without API calls
   - Can test UI/UX without database
   - Easy to enable/disable

### Enabling Dev Mode

Dev mode is automatically enabled when:
- User signs in via "Developer Mode" button on AuthPage
- User ID starts with `'dev-user-'`
- Neighbourhood ID starts with `'dev-neighbourhood-'`

---

## 📋 Possible Solutions & Improvements

### 1. Error Handling

**Current State**: Basic error handling with `alert()` messages

**Possible Solutions**:
- ✅ **Toast Notifications**: Use `react-hot-toast` or `sonner` for better UX
- ✅ **Error Boundary**: Wrap pages in error boundaries for graceful failures
- ✅ **Retry Logic**: Add automatic retry for failed API calls
- ✅ **Offline Support**: Cache data and show offline indicator

**Implementation Example**:
```javascript
import toast from 'react-hot-toast'

try {
  // API call
} catch (err) {
  toast.error(err.message || 'Something went wrong')
}
```

---

### 2. Loading States

**Current State**: Basic loading indicators

**Possible Solutions**:
- ✅ **Skeleton Loaders**: Show skeleton UI while loading
- ✅ **Optimistic Updates**: Update UI immediately, rollback on error
- ✅ **Progressive Loading**: Load critical data first, then details

**Implementation Example**:
```javascript
{isLoading ? (
  <SkeletonLoader count={3} />
) : (
  <PostList posts={posts} />
)}
```

---

### 3. Real-time Updates

**Current State**: Manual refetch required

**Possible Solutions**:
- ✅ **WebSocket Connection**: Use Supabase Realtime for live updates
- ✅ **Polling**: Periodic refetch (every 30 seconds)
- ✅ **Server-Sent Events (SSE)**: One-way real-time updates
- ✅ **React Query Subscriptions**: Use `useSubscription` hook

**Implementation Example** (Supabase Realtime):
```javascript
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'posts' },
      (payload) => {
        queryClient.setQueryData(['posts'], (old) => [payload.new, ...old])
      }
    )
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [])
```

---

### 4. Caching & Performance

**Current State**: React Query with default caching

**Possible Solutions**:
- ✅ **Stale Time Configuration**: Increase stale time for less dynamic data
- ✅ **Cache Persistence**: Persist cache to localStorage
- ✅ **Prefetching**: Prefetch data on hover or route change
- ✅ **Infinite Scroll**: Load more posts as user scrolls

**Implementation Example**:
```javascript
const { data } = useQuery({
  queryKey: ['posts', neighbourhood?.id],
  queryFn: fetchPosts,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
})
```

---

### 5. Image Upload Integration

**Current State**: Not integrated in PostComposer

**Possible Solutions**:
- ✅ **Add Image Upload**: Integrate with `/api/v1/upload/image` endpoint
- ✅ **Image Preview**: Show preview before upload
- ✅ **Multiple Images**: Support multiple image uploads
- ✅ **Image Compression**: Compress images client-side before upload

**Implementation Example**:
```javascript
const handleImageUpload = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${API_BASE_URL}/api/v1/upload/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  })
  
  const { url } = await response.json()
  return url
}
```

---

### 6. Pagination

**Current State**: Loads all posts (limited to 50)

**Possible Solutions**:
- ✅ **Infinite Scroll**: Load more as user scrolls
- ✅ **Page-based Pagination**: Traditional page numbers
- ✅ **Cursor-based Pagination**: More efficient for large datasets
- ✅ **Virtual Scrolling**: Render only visible items

**Implementation Example** (Infinite Scroll):
```javascript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['posts', neighbourhood?.id],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})
```

---

### 7. Search & Filtering

**Current State**: Basic neighbourhood search

**Possible Solutions**:
- ✅ **Post Search**: Search posts by content
- ✅ **Filter by Type**: Filter posts vs alerts
- ✅ **Date Range Filter**: Filter by date
- ✅ **User Filter**: Filter by specific users

**Implementation Example**:
```javascript
const [searchTerm, setSearchTerm] = useState('')
const [filterType, setFilterType] = useState('all')

const filteredPosts = posts.filter(post => {
  const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase())
  const matchesType = filterType === 'all' || post.type === filterType
  return matchesSearch && matchesType
})
```

---

### 8. Offline Support

**Current State**: No offline support

**Possible Solutions**:
- ✅ **Service Worker**: Cache API responses
- ✅ **IndexedDB**: Store data locally
- ✅ **Queue Actions**: Queue posts/comments when offline, sync when online
- ✅ **Offline Indicator**: Show banner when offline

**Implementation Example** (React Query + Service Worker):
```javascript
// Use React Query's persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: Infinity,
      staleTime: Infinity,
    },
  },
})
```

---

### 9. Authentication State Management

**Current State**: Zustand store with localStorage persistence

**Possible Solutions**:
- ✅ **Token Refresh**: Auto-refresh expired tokens
- ✅ **Session Validation**: Periodically validate session
- ✅ **Auto Logout**: Logout on token expiration
- ✅ **Multi-tab Sync**: Sync auth state across tabs

**Implementation Example**:
```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const { session } = useUserStore.getState()
    if (session && isTokenExpired(session.access_token)) {
      await refreshToken()
    }
  }, 5 * 60 * 1000) // Check every 5 minutes
  
  return () => clearInterval(interval)
}, [])
```

---

### 10. Testing

**Current State**: No tests

**Possible Solutions**:
- ✅ **Unit Tests**: Test components in isolation
- ✅ **Integration Tests**: Test API integration
- ✅ **E2E Tests**: Test full user flows
- ✅ **Mock Service Worker**: Mock API responses

**Implementation Example** (Vitest + React Testing Library):
```javascript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FeedPage from './FeedPage'

test('displays posts', async () => {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <FeedPage />
    </QueryClientProvider>
  )
  
  await waitFor(() => {
    expect(screen.getByText('Welcome to Developer Mode!')).toBeInTheDocument()
  })
})
```

---

## 🚀 Priority Recommendations

### High Priority (Do First)
1. **Error Handling with Toast Notifications** - Better UX
2. **Image Upload in PostComposer** - Core feature
3. **Real-time Updates** - Better user experience
4. **Loading States with Skeletons** - Professional feel

### Medium Priority (Do Second)
5. **Pagination/Infinite Scroll** - Performance
6. **Search & Filtering** - User convenience
7. **Offline Support** - Resilience
8. **Token Refresh** - Security

### Low Priority (Do Later)
9. **Testing Infrastructure** - Quality assurance
10. **Advanced Caching** - Optimization

---

## 📝 Notes

- All pages now support dev mode for local development
- Backend API integration is complete for core features
- Error handling is basic but functional
- Consider adding React Query DevTools for debugging
- Monitor API response times and optimize slow endpoints
- Consider adding request cancellation for better UX



