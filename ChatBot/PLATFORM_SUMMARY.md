# Hyper-Local Neighbourhood Social Network - Platform Summary

## 📋 Overview

A hyper-local social platform designed for South African neighbourhoods that enables neighbours to connect, share local updates, post alerts, browse local businesses, and participate in a marketplace - all within their specific neighbourhood boundaries.

**Platform Type**: Social Network / Community Platform  
**Target Market**: South African neighbourhoods  
**Primary Use Case**: Local community engagement and information sharing

---

## 🎯 Core Functionality

### 1. User Authentication & Onboarding
- **Email/Password Authentication**: Secure signup and signin with email verification
- **Password Recovery**: Forgot password flow with email reset links
- **hCaptcha Integration**: Bot protection on all authentication endpoints
- **Neighbourhood Selection**: 
  - GPS-based automatic detection
  - Manual search by city/neighbourhood name
  - List-based selection
  - One neighbourhood per user (can be changed)

### 2. Social Feed
- **Post Types**:
  - Regular posts: General community updates
  - Alerts: Urgent/important notifications (highlighted in red)
- **Post Features**:
  - Text content
  - Image uploads (via Supabase Storage)
  - Timestamps
  - Author information
  - Comment count
  - Like count (future)
- **Feed Filtering**: 
  - Neighbourhood-specific (users only see posts from their neighbourhood)
  - Chronological ordering (newest first)
  - Type filtering (posts vs alerts)

### 3. Comments System
- **Comment on Posts**: Users can comment on any post in their neighbourhood
- **Comment Features**:
  - Text content
  - Timestamps
  - Author information
  - Edit/Delete (author only)
- **Real-time Updates**: Comments appear in chronological order

### 4. Marketplace
- **Item Listings**: Users can list items for sale/trade
- **Item Features**:
  - Title and description
  - Price
  - Category
  - Images
  - Location (neighbourhood-specific)
  - Status (available/sold)
- **Search & Filter**:
  - Search by title/description
  - Filter by category
  - Filter by price range
  - Neighbourhood-specific results

### 5. Business Listings
- **Business Directory**: Local businesses can create listings
- **Business Features**:
  - Business name and description
  - Category/type
  - Contact information
  - Location
  - Operating hours (future)
  - Ratings/reviews (future)
- **Search & Filter**:
  - Search by name/description
  - Filter by category
  - Neighbourhood-specific results

### 6. Notifications
- **Push Notifications**: Via OneSignal integration
- **Notification Types**:
  - New alerts in neighbourhood
  - Comments on user's posts
  - Replies to user's comments (future)
  - Marketplace item updates (future)
- **User Control**: Users can register/unregister for push notifications

### 7. User Profiles
- **Profile Information**:
  - Name
  - Email
  - Phone (optional)
  - Neighbourhood association
  - Profile picture (future)
- **Profile Management**: Users can update their information

---

## 🔄 User Flows

### New User Onboarding
1. User visits platform → Auth page
2. User signs up with email/password + hCaptcha
3. Email verification (if enabled)
4. User selects neighbourhood (GPS or manual)
5. User lands on feed page
6. User can now post, comment, browse marketplace

### Creating a Post
1. User clicks "+" button on feed
2. Post composer opens
3. User selects type (Post or Alert)
4. User enters content
5. User can optionally upload image
6. User submits → Post appears in feed
7. Alert posts trigger push notifications to neighbourhood

### Commenting on a Post
1. User clicks on post card
2. Comment drawer opens
3. User sees existing comments
4. User types comment
5. User submits → Comment appears in drawer
6. Comment count updates on post card

### Marketplace Interaction
1. User navigates to marketplace (future page)
2. User can browse items in their neighbourhood
3. User can search/filter items
4. User can view item details
5. User can contact seller (future)
6. User can create their own listing

### Business Discovery
1. User navigates to business directory (future page)
2. User can browse businesses in their neighbourhood
3. User can search/filter businesses
4. User can view business details
5. User can contact business (future)

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /signup` - Create new account
- `POST /signin` - Sign in existing user
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /signout` - Sign out user

### Posts (`/api/v1/posts`)
- `POST /` - Create new post
- `GET /?neighbourhood_id={id}` - Get posts for neighbourhood
- `GET /{post_id}` - Get specific post (future)
- `PATCH /{post_id}` - Update post (author only, future)
- `DELETE /{post_id}` - Delete post (author only, future)

### Comments (`/api/v1/comments`)
- `POST /` - Create comment
- `GET /post/{post_id}` - Get comments for post
- `GET /{comment_id}` - Get specific comment
- `PATCH /{comment_id}` - Update comment (author only)
- `DELETE /{comment_id}` - Delete comment (author only)

### Users (`/api/v1/users`)
- `GET /me` - Get current user profile
- `PATCH /me` - Update user profile
- `POST /neighbourhood` - Update user's neighbourhood

### Neighbourhoods (`/api/v1/neighbourhoods`)
- `GET /` - Get all neighbourhoods (with filters)
- `GET /{id}` - Get neighbourhood by ID
- `POST /nearest` - Find nearest neighbourhood by coordinates

### Marketplace (`/api/v1/marketplace`)
- `POST /` - Create marketplace item
- `GET /` - Get marketplace items (with filters)
- `GET /{item_id}` - Get item by ID
- `PATCH /{item_id}` - Update item (owner only)
- `DELETE /{item_id}` - Delete item (owner only)
- `GET /search` - Search items

### Businesses (`/api/v1/businesses`)
- `POST /` - Create business listing
- `GET /` - Get business listings (with filters)
- `GET /{business_id}` - Get business by ID
- `PATCH /{business_id}` - Update business (owner only)
- `DELETE /{business_id}` - Delete business (owner only)
- `GET /search` - Search businesses

### Upload (`/api/v1/upload`)
- `POST /image` - Upload image file
- `DELETE /image` - Delete image file

### Notifications (`/api/v1/notifications`)
- `POST /register` - Register OneSignal player ID
- `GET /test-connection` - Test OneSignal connection
- `POST /test-send` - Test send notification

---

## 🗄️ Data Structures

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "phone": "+27123456789",
  "neighbourhood_id": "uuid",
  "onesignal_player_id": "string"
}
```

### Post
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "neighbourhood_id": "uuid",
  "content": "Post text content",
  "type": "post" | "alert",
  "image_url": "https://...",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com"
  },
  "comments_count": 5,
  "likes_count": 10
}
```

### Comment
```json
{
  "id": "uuid",
  "post_id": "uuid",
  "user_id": "uuid",
  "content": "Comment text",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### Neighbourhood
```json
{
  "id": "uuid",
  "name": "Cape Town CBD",
  "city": "Cape Town",
  "province": "Western Cape",
  "country": "South Africa",
  "latitude": -33.9249,
  "longitude": 18.4241
}
```

### Marketplace Item
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "neighbourhood_id": "uuid",
  "title": "Item Title",
  "description": "Item description",
  "price": 100.00,
  "category": "electronics",
  "image_url": "https://...",
  "status": "available" | "sold",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Business Listing
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "neighbourhood_id": "uuid",
  "name": "Business Name",
  "description": "Business description",
  "category": "restaurant",
  "contact_email": "business@example.com",
  "contact_phone": "+27123456789",
  "address": "123 Main St",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 🤖 Chatbot Integration Points

### 1. User Queries
**What users can ask:**
- "Show me recent posts in my neighbourhood"
- "What alerts are there in my area?"
- "Find businesses near me"
- "Search for [item] in marketplace"
- "What's happening in [neighbourhood name]?"
- "Show me posts about [topic]"
- "Who posted [content]?"

### 2. Content Creation via Chatbot
**What users can do:**
- "Post an alert: [message]"
- "Create a post: [content]"
- "Comment on post [id]: [comment]"
- "List an item: [title] for [price]"
- "Add my business: [details]"

### 3. Information Retrieval
**What chatbot can provide:**
- Neighbourhood information
- Post details and comments
- Marketplace item details
- Business listings
- User profile information
- Statistics (post count, active users, etc.)

### 4. Notifications & Alerts
**What chatbot can handle:**
- "Notify me about new alerts"
- "Send me updates on [topic]"
- "Alert me when someone comments on my post"
- "What notifications do I have?"

### 5. Search & Discovery
**What chatbot can search:**
- Posts by keyword
- Marketplace items by category/price
- Businesses by type
- Users by name
- Neighbourhoods by location

---

## 🔐 Security & Privacy

### Authentication
- JWT token-based authentication
- Token expiration and refresh
- hCaptcha bot protection
- Password hashing (via Supabase)

### Data Isolation
- Row-Level Security (RLS) in Supabase
- Users can only see content from their neighbourhood
- API endpoints validate user authorization
- Neighbourhood-based filtering on all queries

### Privacy
- User data is neighbourhood-scoped
- No cross-neighbourhood data leakage
- User can update/delete their own content
- Profile information is optional

---

## 📊 Platform Statistics (Future)

### Metrics Available
- Total users per neighbourhood
- Active posts per day/week
- Alert frequency
- Marketplace listings count
- Business directory size
- Engagement rates (comments, likes)

### Analytics (Future)
- Most active neighbourhoods
- Trending topics
- Popular categories
- User engagement patterns

---

## 🚀 Future Features (Planned)

### Social Features
- Post likes/upvotes
- User profiles with avatars
- Follow users
- Share posts
- Post reactions (emoji)

### Marketplace Enhancements
- Item favorites
- Seller ratings
- Transaction history
- Payment integration
- Item categories expansion

### Business Features
- Business reviews/ratings
- Operating hours
- Menu/services listing
- Booking/reservation system
- Business verification badges

### Communication
- Direct messaging between users
- Group chats for neighbourhoods
- Event creation and RSVP
- Polls and surveys

### Advanced Features
- Real-time notifications
- Advanced search with filters
- Content moderation
- Admin dashboard
- Analytics dashboard
- Mobile app (React Native)

---

## 🔌 Technical Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- React Query (data fetching)
- Framer Motion (animations)
- React Router (routing)

### Backend
- FastAPI (Python)
- Supabase (PostgreSQL, Auth, Storage)
- OneSignal (push notifications)
- PyJWT (JWT verification)
- httpx (HTTP client)

### Infrastructure
- Supabase (database, auth, storage)
- OneSignal (notifications)
- Docker (containerization)
- Railway/Fly.io (deployment)

---

## 📱 Platform Capabilities Summary

### What the Platform Does:
1. **Connects Neighbours**: Users in the same neighbourhood can interact
2. **Shares Information**: Posts and alerts keep community informed
3. **Facilitates Commerce**: Marketplace for local buying/selling
4. **Promotes Businesses**: Business directory for local discovery
5. **Enables Communication**: Comments and discussions on posts
6. **Sends Notifications**: Push alerts for important updates
7. **Maintains Privacy**: Neighbourhood-scoped data isolation

### What Users Can Do:
- ✅ Sign up and select their neighbourhood
- ✅ Create posts (regular and alerts)
- ✅ Comment on posts
- ✅ Upload images
- ✅ Browse marketplace items
- ✅ List items for sale
- ✅ Browse business directory
- ✅ Create business listings
- ✅ Receive push notifications
- ✅ Search content
- ✅ Update their profile

### What the Platform Provides:
- ✅ Neighbourhood-specific content feed
- ✅ Real-time updates (via API polling)
- ✅ Image storage and hosting
- ✅ Secure authentication
- ✅ Mobile-responsive design
- ✅ Developer mode for testing

---

## 🎯 Use Cases for Chatbot Integration

### 1. Content Discovery
**User**: "What's happening in my neighbourhood?"  
**Chatbot**: Queries posts API, formats and presents recent posts

### 2. Alert Creation
**User**: "Post an alert: Water outage on Main Street"  
**Chatbot**: Creates alert post via API, confirms with user

### 3. Marketplace Search
**User**: "Find a bicycle under R500"  
**Chatbot**: Searches marketplace, filters by price, presents results

### 4. Business Discovery
**User**: "What restaurants are in my area?"  
**Chatbot**: Queries business API, filters by category, presents list

### 5. Information Lookup
**User**: "How many active users are in my neighbourhood?"  
**Chatbot**: Queries statistics, provides count

### 6. Content Interaction
**User**: "Comment on post 123: Great idea!"  
**Chatbot**: Creates comment via API, confirms action

### 7. Notification Management
**User**: "What notifications do I have?"  
**Chatbot**: Checks user's notification status, lists unread items

---

## 📝 API Response Formats

### Success Response
```json
{
  "id": "uuid",
  "data": {...},
  "message": "Success message"
}
```

### Error Response
```json
{
  "detail": "Error message",
  "error_code": "ERR_CODE",
  "request_id": "uuid"
}
```

### List Response
```json
[
  {...},
  {...}
]
```

---

## 🔄 Real-time Capabilities

### Current
- API polling for updates
- Manual refresh triggers
- React Query caching

### Future
- WebSocket connections
- Supabase Realtime subscriptions
- Server-Sent Events (SSE)
- Live comment updates
- Real-time post notifications

---

## 📍 Location Features

### Current
- GPS-based neighbourhood detection
- Manual neighbourhood selection
- Neighbourhood-based content filtering

### Future
- Multiple neighbourhood following
- Location-based recommendations
- Geofenced notifications
- Map view of posts/items
- Distance calculations

---

## 🎨 User Experience Features

### Current
- Mobile-first responsive design
- Black/white theme (Cal.com inspired)
- Smooth animations (Framer Motion)
- Loading states
- Error handling

### Future
- Dark mode toggle
- Customizable themes
- Accessibility improvements
- Offline support
- Progressive Web App (PWA)

---

## 📈 Platform Growth Features

### Viral Mechanisms
- Invite system (future)
- Share links
- WhatsApp group migration
- Referral rewards (future)

### Engagement Features
- Gamification (future)
- Badges and achievements (future)
- Leaderboards (future)
- Community challenges (future)

---

## 🔧 Developer Features

### Dev Mode
- Bypass authentication
- Mock data generation
- No backend required
- Console logging
- Fast iteration

### Testing
- API endpoint testing
- Integration testing (future)
- E2E testing (future)
- Load testing (future)

---

## 📞 Support & Moderation

### Current
- Error messages
- User feedback
- Basic validation

### Future
- Content moderation
- Report system
- Admin dashboard
- User support chat
- FAQ system

---

## 🌍 Localization

### Current
- English language
- South African focus

### Future
- Multi-language support
- Regional customization
- Currency localization
- Date/time formatting

---


---

## 🤖 Chatbot Integration Recommendations

### 1. Natural Language Processing
- Parse user intents (post, search, query)
- Extract entities (neighbourhood names, item types, prices)
- Handle variations in phrasing

### 2. Context Management
- Remember user's neighbourhood
- Track conversation context
- Maintain user session

### 3. API Integration
- Use existing REST API endpoints
- Handle authentication tokens
- Manage rate limiting
- Error handling and retries

### 4. Response Formatting
- Format posts/comments for chat
- Create rich media responses
- Handle pagination for lists
- Provide actionable buttons

### 5. User Experience
- Confirm actions before execution
- Provide feedback on success/failure
- Offer suggestions and help
- Handle ambiguous queries gracefully

---

This document provides a comprehensive overview of the platform's capabilities, data structures, and integration points for chatbot development.

