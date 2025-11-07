# Architektura Frontend (Next.js)

## Wprowadzenie

Frontend Multimedia Portal jest zbudowany w Next.js 16 z wykorzystaniem React 19.2.0, Tailwind CSS 4 i nowoczesnych narzędzi do zarządzania stanem i danymi.

## Struktura Projektu

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── globals.css               # Global styles
│   │   │
│   │   ├── (auth)/                   # Auth routes group
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── articles/                 # Articles routes
│   │   │   ├── page.tsx             # List page
│   │   │   └── [slug]/              # Detail page
│   │   │       └── page.tsx
│   │   │
│   │   ├── blog/                     # Blog routes
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── wiki/                     # Wiki routes
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── gallery/                  # Gallery routes
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── stories/                  # Stories routes
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── search/                   # Search route
│   │   │   └── page.tsx
│   │   │
│   │   └── dashboard/                # Admin dashboard
│   │       ├── layout.tsx           # Dashboard layout
│   │       ├── page.tsx             # Overview
│   │       ├── articles/
│   │       ├── blog/
│   │       ├── wiki/
│   │       ├── gallery/
│   │       ├── stories/
│   │       ├── authors/
│   │       ├── users/
│   │       ├── settings/
│   │       └── notifications/
│   │
│   ├── components/                   # React components
│   │   ├── layout/                  # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── navigation.tsx
│   │   │
│   │   ├── admin/                   # Admin components
│   │   │   ├── sidebar.tsx
│   │   │   ├── dashboard-header.tsx
│   │   │   ├── articles/
│   │   │   ├── blog/
│   │   │   ├── wiki/
│   │   │   └── ...
│   │   │
│   │   ├── ui/                      # Generic UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── comments/                # Comments system
│   │   │   ├── comments-section.tsx
│   │   │   ├── comment-item.tsx
│   │   │   └── comment-form.tsx
│   │   │
│   │   ├── rating/                  # Rating system
│   │   │   ├── rating-widget.tsx
│   │   │   └── rating-display.tsx
│   │   │
│   │   ├── editor/                  # Rich text editor
│   │   │   └── rich-text-editor-lazy.tsx
│   │   │
│   │   ├── search/                  # Search components
│   │   │   ├── search-bar.tsx
│   │   │   ├── search-history.tsx
│   │   │   └── search-suggestions.tsx
│   │   │
│   │   ├── gallery/                 # Gallery components
│   │   │   ├── gallery-grid.tsx
│   │   │   └── gallery-item.tsx
│   │   │
│   │   ├── notifications/           # Notifications
│   │   │   └── notification-bell.tsx
│   │   │
│   │   └── error/                   # Error handling
│   │       └── error-boundary.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.ts              # Auth hook
│   │   ├── use-content.ts           # Content fetching
│   │   ├── use-socket.tsx           # WebSocket
│   │   ├── use-toast.tsx            # Toast notifications
│   │   ├── use-search-history.ts    # Search history
│   │   └── use-push-notifications.tsx
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── auth-store.ts            # Auth state
│   │   ├── notification-store.ts    # Notifications
│   │   ├── theme-store.ts           # Theme
│   │   └── index.ts
│   │
│   ├── lib/                          # Libraries & utilities
│   │   ├── api/                     # API integration
│   │   │   ├── api.ts              # Axios client
│   │   │   └── content.ts          # Content API
│   │   ├── auth.ts                  # Auth utilities
│   │   ├── api-error-handler.ts
│   │   ├── error-logger.ts
│   │   └── utils.ts
│   │
│   ├── providers/                    # Context providers
│   │   ├── query-provider.tsx       # React Query
│   │   └── auth-provider.tsx        # Auth context
│   │
│   ├── types/                        # TypeScript types
│   │   ├── content.ts
│   │   ├── comment.ts
│   │   ├── rating.ts
│   │   └── search.ts
│   │
│   └── utils/                        # Utility functions
│       ├── format-date.ts
│       ├── slugify.ts
│       └── validation.ts
│
├── public/                           # Static assets
│   ├── images/
│   └── icons/
│
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── jest.config.ts                    # Jest configuration
├── playwright.config.ts              # Playwright configuration
└── package.json
```

## App Router (Next.js 14+)

### Struktura Routingu

```typescript
// app/layout.tsx - Root Layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
              <Toaster />
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Public Routes

#### Landing Page (`app/page.tsx`)
```typescript
export default async function HomePage() {
  // Server-side data fetching
  const featuredArticles = await fetch('http://backend/api/articles?featured=true');

  return (
    <div>
      <HeroSection />
      <FeaturedArticles articles={featuredArticles} />
      <ContentCategories />
      <RecentBlogPosts />
      <CallToAction />
    </div>
  );
}
```

#### Content Detail Page (`app/articles/[slug]/page.tsx`)
```typescript
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await fetchArticle(params.slug);

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.featuredImage],
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return (
    <article>
      <ArticleHeader />
      <ArticleContent />
      <RatingWidget />
      <CommentsSection contentType="article" contentId={article.id} />
      <RelatedArticles />
    </article>
  );
}
```

### Protected Routes (Dashboard)

#### Dashboard Layout (`app/dashboard/layout.tsx`)
```typescript
'use client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }

    if (user && !['ADMIN', 'MODERATOR'].includes(user.role)) {
      router.push('/');
    }
  }, [user, isLoading]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Articles Management (`app/dashboard/articles/page.tsx`)
```typescript
'use client';

export default function ArticlesManagementPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => fetchArticles(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article deleted');
    },
  });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Button onClick={() => setShowModal(true)}>
          Create Article
        </Button>
      </div>

      <ArticlesTable
        articles={data}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {showModal && (
        <ArticleFormModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
```

## State Management

### Zustand Stores

#### Auth Store (`stores/auth-store.ts`)
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;

      setToken(accessToken);
      set({ user, error: null });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      const { accessToken, user } = response.data;

      setToken(accessToken);
      set({ user, error: null });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  logout: async () => {
    await api.post('/auth/logout');
    removeToken();
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const token = getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await api.get('/auth/me');
      set({ user: response.data, isLoading: false });
    } catch (error) {
      removeToken();
      set({ user: null, isLoading: false });
    }
  },
}));
```

#### Notification Store (`stores/notification-store.ts`)
```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
```

### React Query Integration

#### Query Provider Setup (`providers/query-provider.tsx`)
```typescript
'use client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

## Custom Hooks

### use-content Hook
```typescript
export function useContent(contentType: ContentType) {
  // Fetch list
  const useContentList = (filters?: ContentFilters) => {
    return useQuery({
      queryKey: [contentType, filters],
      queryFn: () => fetchContentList(contentType, filters),
    });
  };

  // Fetch single item
  const useContentItem = (slug: string) => {
    return useQuery({
      queryKey: [contentType, slug],
      queryFn: () => fetchContentBySlug(contentType, slug),
      enabled: !!slug,
    });
  };

  // Create mutation
  const useCreateContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateContentDto) => createContent(contentType, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [contentType] });
        toast.success('Content created successfully');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // Update mutation
  const useUpdateContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateContentDto }) =>
        updateContent(contentType, id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [contentType] });
        queryClient.invalidateQueries({ queryKey: [contentType, variables.id] });
        toast.success('Content updated successfully');
      },
    });
  };

  // Delete mutation
  const useDeleteContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => deleteContent(contentType, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [contentType] });
        toast.success('Content deleted successfully');
      },
    });
  };

  // Rating mutation
  const useRateContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ contentId, rating }: { contentId: string; rating: number }) =>
        rateContent(contentType, contentId, rating),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [contentType, variables.contentId] });
      },
    });
  };

  return {
    useContentList,
    useContentItem,
    useCreateContent,
    useUpdateContent,
    useDeleteContent,
    useRateContent,
  };
}
```

### use-socket Hook
```typescript
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        token: getToken(),
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join', user.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return { socket, isConnected };
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notification: Notification) => {
      addNotification(notification);
      toast(notification.title, {
        description: notification.message,
      });
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
```

## API Integration

### Axios Client (`lib/api/api.ts`)
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodaj JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        setToken(accessToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        removeToken();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Content API (`lib/api/content.ts`)
```typescript
export async function fetchContentList(
  contentType: ContentType,
  filters?: ContentFilters
): Promise<PaginatedResponse<Content>> {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const endpoint = getContentEndpoint(contentType);
  const response = await api.get(`${endpoint}?${params.toString()}`);

  return response.data;
}

export async function fetchContentBySlug(
  contentType: ContentType,
  slug: string
): Promise<Content> {
  const endpoint = getContentEndpoint(contentType);
  const response = await api.get(`${endpoint}/${slug}`);

  return response.data;
}

export async function rateContent(
  contentType: ContentType,
  contentId: string,
  rating: number
): Promise<void> {
  await api.post('/ratings', {
    contentType: contentType.toUpperCase(),
    contentId,
    value: rating,
  });
}

export async function fetchComments(
  contentType: ContentType,
  contentId: string
): Promise<Comment[]> {
  const response = await api.get('/comments', {
    params: {
      contentType: contentType.toUpperCase(),
      contentId,
    },
  });

  return response.data;
}

export async function addComment(
  contentType: ContentType,
  contentId: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  const response = await api.post('/comments', {
    contentType: contentType.toUpperCase(),
    contentId,
    content,
    parentId,
  });

  return response.data;
}

function getContentEndpoint(contentType: ContentType): string {
  const endpoints: Record<ContentType, string> = {
    article: '/articles',
    blogPost: '/blog',
    wikiPage: '/wiki',
    galleryItem: '/gallery',
    story: '/stories',
  };

  return endpoints[contentType];
}
```

## Components

### Comments Section (`components/comments/comments-section.tsx`)
```typescript
interface CommentsSectionProps {
  contentType: ContentType;
  contentId: string;
}

export function CommentsSection({ contentType, contentId }: CommentsSectionProps) {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', contentType, contentId],
    queryFn: () => fetchComments(contentType, contentId),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => addComment(contentType, contentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', contentType, contentId] });
      toast.success('Comment added');
    },
  });

  if (isLoading) return <CommentsSkeleton />;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Comments ({comments?.length || 0})</h2>

      <CommentForm
        onSubmit={(content) => addCommentMutation.mutate(content)}
        isLoading={addCommentMutation.isPending}
      />

      <div className="mt-6 space-y-4">
        {comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            contentType={contentType}
            contentId={contentId}
          />
        ))}
      </div>
    </div>
  );
}
```

### Rating Widget (`components/rating/rating-widget.tsx`)
```typescript
interface RatingWidgetProps {
  contentType: ContentType;
  contentId: string;
  currentRating?: number;
  averageRating: number;
  ratingCount: number;
}

export function RatingWidget({
  contentType,
  contentId,
  currentRating,
  averageRating,
  ratingCount,
}: RatingWidgetProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { user } = useAuthStore();

  const rateMutation = useMutation({
    mutationFn: (rating: number) => rateContent(contentType, contentId, rating),
    onSuccess: () => {
      toast.success('Rating submitted');
    },
  });

  const handleRate = (rating: number) => {
    if (!user) {
      toast.error('Please login to rate');
      return;
    }

    rateMutation.mutate(rating);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            disabled={!user || rateMutation.isPending}
            className="hover:scale-110 transition-transform"
          >
            <Star
              className={cn(
                'w-6 h-6',
                (hoveredRating || currentRating || 0) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>

      <div className="text-sm text-gray-600">
        {averageRating.toFixed(1)} ({ratingCount} ratings)
      </div>
    </div>
  );
}
```

## Styling z Tailwind CSS

### Configuration (`tailwind.config.ts`)
```typescript
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... więcej kolorów
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

### Component Styling Example
```typescript
<div className="
  container
  mx-auto
  px-4
  py-8
  md:px-6
  lg:px-8
">
  <h1 className="
    text-3xl
    md:text-4xl
    lg:text-5xl
    font-bold
    text-gray-900
    dark:text-white
  ">
    Title
  </h1>

  <p className="
    mt-4
    text-base
    md:text-lg
    text-gray-600
    dark:text-gray-400
  ">
    Content
  </p>
</div>
```

## Performance Optimization

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src={article.featuredImage}
  alt={article.title}
  width={800}
  height={400}
  quality={85}
  loading="lazy"
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>
```

### Code Splitting
```typescript
// Lazy load heavy components
const RichTextEditor = dynamic(
  () => import('@/components/editor/rich-text-editor-lazy'),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);
```

### React Query Optimizations
```typescript
// Prefetch data
await queryClient.prefetchQuery({
  queryKey: ['articles'],
  queryFn: fetchArticles,
});

// Optimistic updates
const updateMutation = useMutation({
  mutationFn: updateArticle,
  onMutate: async (newArticle) => {
    await queryClient.cancelQueries({ queryKey: ['article', newArticle.id] });

    const previousArticle = queryClient.getQueryData(['article', newArticle.id]);

    queryClient.setQueryData(['article', newArticle.id], newArticle);

    return { previousArticle };
  },
  onError: (err, newArticle, context) => {
    queryClient.setQueryData(
      ['article', newArticle.id],
      context?.previousArticle
    );
  },
});
```

## Testing

### Component Testing
```typescript
describe('ArticleCard', () => {
  it('renders article information correctly', () => {
    const article = {
      id: '1',
      title: 'Test Article',
      excerpt: 'Test excerpt',
      slug: 'test-article',
    };

    render(<ArticleCard article={article} />);

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('Test excerpt')).toBeInTheDocument();
  });
});
```

### E2E Testing with Playwright
```typescript
test('user can create a new article', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to articles
  await page.goto('/dashboard/articles');

  // Create article
  await page.click('button:has-text("Create Article")');
  await page.fill('input[name="title"]', 'New Article');
  await page.fill('textarea[name="content"]', 'Article content');
  await page.click('button:has-text("Save")');

  // Verify
  await expect(page.locator('text=Article created')).toBeVisible();
});
```

## Podsumowanie

Frontend Multimedia Portal wykorzystuje:
- **Next.js App Router**: SSR, routing, optimization
- **React Query**: Server state management
- **Zustand**: Client state management
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety
- **Custom Hooks**: Reusable logic
- **WebSocket**: Real-time features

---

**Wersja**: 1.0.0
**Data**: 2025-11-07
