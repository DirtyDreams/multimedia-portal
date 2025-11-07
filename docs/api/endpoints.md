# API Endpoints - Pełna Dokumentacja

## Base URL

**Development**: `http://localhost:3001/api`
**Production**: `https://your-domain.com/api`

## Format Odpowiedzi

### Success Response
```json
{
  "data": { /* response data */ },
  "meta": { /* optional metadata */ }
}
```

### Paginated Response
```json
{
  "data": [/* items */],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Autentykacja

Większość endpoints wymaga JWT token w header:
```
Authorization: Bearer <jwt_token>
```

## 1. Authentication Endpoints

### POST /auth/register
Rejestracja nowego użytkownika.

**Auth**: Publiczny

**Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response** (201):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Curl**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### POST /auth/login
Logowanie użytkownika.

**Auth**: Publiczny

**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### GET /auth/me
Pobierz informacje o zalogowanym użytkowniku.

**Auth**: JWT Required

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "name": "John Doe",
  "role": "USER",
  "avatar": "https://cdn.example.com/avatar.jpg",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Curl**:
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

### POST /auth/logout
Wylogowanie użytkownika.

**Auth**: JWT Required

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

### POST /auth/refresh
Odśwież access token.

**Auth**: Publiczny

**Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 2. Articles Endpoints

### GET /articles
Pobierz listę artykułów z paginacją.

**Auth**: Publiczny

**Query Parameters**:
- `page` (number): Numer strony (default: 1)
- `limit` (number): Liczba elementów (default: 10, max: 100)
- `status` (string): DRAFT | PUBLISHED | SCHEDULED | ARCHIVED
- `category` (string): Slug kategorii
- `tag` (string): Slug tagu
- `authorId` (string): ID autora
- `search` (string): Wyszukiwanie w tytule/treści
- `sort` (string): Sortowanie (createdAt, publishedAt, title, viewCount)
- `order` (string): asc | desc

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Example Article",
      "slug": "example-article",
      "excerpt": "Short description...",
      "featuredImage": "https://cdn.example.com/image.jpg",
      "status": "PUBLISHED",
      "publishedAt": "2025-01-01T00:00:00.000Z",
      "viewCount": 150,
      "readingTime": 5,
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "slug": "john-doe"
      },
      "categories": [
        {
          "id": "uuid",
          "name": "Technology",
          "slug": "technology"
        }
      ],
      "tags": [
        {
          "id": "uuid",
          "name": "JavaScript",
          "slug": "javascript"
        }
      ],
      "_count": {
        "comments": 12,
        "ratings": 8
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Curl**:
```bash
curl -X GET "http://localhost:3001/api/articles?page=1&limit=10&status=PUBLISHED&category=technology"
```

### GET /articles/:identifier
Pobierz pojedynczy artykuł (po ID lub slug).

**Auth**: Publiczny

**Response** (200):
```json
{
  "id": "uuid",
  "title": "Example Article",
  "slug": "example-article",
  "content": "Full article content...",
  "excerpt": "Short description...",
  "featuredImage": "https://cdn.example.com/image.jpg",
  "status": "PUBLISHED",
  "publishedAt": "2025-01-01T00:00:00.000Z",
  "viewCount": 151,
  "readingTime": 5,
  "author": {
    "id": "uuid",
    "name": "John Doe",
    "slug": "john-doe",
    "bio": "Author bio..."
  },
  "user": {
    "id": "uuid",
    "name": "Creator Name"
  },
  "categories": [...],
  "tags": [...],
  "comments": [
    {
      "id": "uuid",
      "content": "Great article!",
      "user": {
        "id": "uuid",
        "name": "Commenter"
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "replies": [...]
    }
  ],
  "ratings": {
    "average": 4.5,
    "count": 8,
    "userRating": 5
  }
}
```

**Curl**:
```bash
curl -X GET http://localhost:3001/api/articles/example-article
```

### POST /articles
Utwórz nowy artykuł.

**Auth**: JWT Required (ADMIN/MODERATOR)

**Body**:
```json
{
  "title": "New Article",
  "content": "Article content...",
  "excerpt": "Short description",
  "featuredImage": "https://cdn.example.com/image.jpg",
  "status": "DRAFT",
  "authorId": "uuid",
  "categoryIds": ["uuid1", "uuid2"],
  "tagIds": ["uuid1", "uuid2"]
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "title": "New Article",
  "slug": "new-article",
  ...
}
```

**Curl**:
```bash
curl -X POST http://localhost:3001/api/articles \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Article",
    "content": "Article content...",
    "status": "DRAFT"
  }'
```

### PUT /articles/:id
Zaktualizuj artykuł.

**Auth**: JWT Required (ADMIN/MODERATOR)

**Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "PUBLISHED"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "title": "Updated Title",
  ...
}
```

### DELETE /articles/:id
Usuń artykuł.

**Auth**: JWT Required (ADMIN)

**Response** (200):
```json
{
  "message": "Article deleted successfully"
}
```

## 3. Blog Posts Endpoints

Identyczna struktura jak Articles:
- `GET /blog`
- `GET /blog/:identifier`
- `POST /blog`
- `PUT /blog/:id`
- `DELETE /blog/:id`

## 4. Wiki Pages Endpoints

### GET /wiki
Lista stron wiki (z hierarchią).

**Query Parameters**:
- Standardowe + `parentId` (string): Filtruj po parent page

**Response** zawiera dodatkowo:
```json
{
  "data": [
    {
      ...standardowe pola,
      "parent": {
        "id": "uuid",
        "title": "Parent Page",
        "slug": "parent-page"
      },
      "children": [
        {
          "id": "uuid",
          "title": "Child Page",
          "slug": "child-page"
        }
      ]
    }
  ]
}
```

### GET /wiki/:identifier
Pobierz stronę wiki z breadcrumbs.

**Response** zawiera:
```json
{
  ...,
  "breadcrumbs": [
    { "title": "Home", "slug": "home" },
    { "title": "Parent", "slug": "parent" },
    { "title": "Current Page", "slug": "current-page" }
  ],
  "children": [...]
}
```

## 5. Gallery Endpoints

### GET /gallery
Lista elementów galerii.

**Query Parameters**:
- Standardowe + `fileType` (IMAGE | VIDEO)

### POST /gallery
Upload pliku do galerii.

**Auth**: JWT Required (ADMIN/MODERATOR)

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file` (File): Plik do uploadu
- `title` (string)
- `description` (string)
- `categoryIds` (array)
- `tagIds` (array)

**Response** (201):
```json
{
  "id": "uuid",
  "title": "Image Title",
  "fileUrl": "https://storage.example.com/image.jpg",
  "thumbnailUrl": "https://storage.example.com/thumb.jpg",
  "fileType": "IMAGE",
  "fileSize": 1024000,
  "mimeType": "image/jpeg",
  "dimensions": {
    "width": 1920,
    "height": 1080
  }
}
```

**Curl**:
```bash
curl -X POST http://localhost:3001/api/gallery \
  -H "Authorization: Bearer <jwt_token>" \
  -F "file=@/path/to/image.jpg" \
  -F "title=My Image" \
  -F "description=Image description"
```

## 6. Stories Endpoints

Podobna struktura jak Articles, dodatkowo:

**Response** zawiera:
```json
{
  ...,
  "series": "Fantasy Series",
  "seriesOrder": 1,
  "wordCount": 5000
}
```

## 7. Authors Endpoints

### GET /authors
Lista autorów.

### GET /authors/:identifier
Profil autora z jego treściami.

**Response** (200):
```json
{
  "id": "uuid",
  "name": "John Doe",
  "slug": "john-doe",
  "bio": "Author biography...",
  "email": "john@example.com",
  "website": "https://johndoe.com",
  "socialMedia": {
    "twitter": "@johndoe",
    "linkedin": "johndoe"
  },
  "profileImage": "https://cdn.example.com/avatar.jpg",
  "articles": [...],
  "blogPosts": [...],
  "stats": {
    "totalArticles": 25,
    "totalViews": 10000
  }
}
```

### POST /authors
Utwórz autora.

**Auth**: JWT Required (ADMIN)

### PUT /authors/:id
Zaktualizuj autora.

**Auth**: JWT Required (ADMIN)

### DELETE /authors/:id
Usuń autora.

**Auth**: JWT Required (ADMIN)

## 8. Comments Endpoints

### GET /comments
Pobierz komentarze.

**Auth**: Publiczny

**Query Parameters**:
- `contentType` (required): ARTICLE | BLOG_POST | WIKI_PAGE | GALLERY_ITEM | STORY
- `contentId` (required): ID treści
- `page`, `limit`

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Great article!",
      "contentType": "ARTICLE",
      "contentId": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "https://cdn.example.com/avatar.jpg"
      },
      "parentId": null,
      "replies": [
        {
          "id": "uuid",
          "content": "Thanks!",
          "user": {...},
          "createdAt": "2025-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Curl**:
```bash
curl -X GET "http://localhost:3001/api/comments?contentType=ARTICLE&contentId=<article_id>"
```

### POST /comments
Dodaj komentarz.

**Auth**: JWT Required

**Body**:
```json
{
  "content": "Great article!",
  "contentType": "ARTICLE",
  "contentId": "uuid",
  "parentId": "uuid" // Optional, for replies
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "content": "Great article!",
  "user": {...},
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Curl**:
```bash
curl -X POST http://localhost:3001/api/comments \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great article!",
    "contentType": "ARTICLE",
    "contentId": "uuid"
  }'
```

### PUT /comments/:id
Edytuj komentarz.

**Auth**: JWT Required (własny komentarz)

### DELETE /comments/:id
Usuń komentarz.

**Auth**: JWT Required (własny komentarz lub ADMIN)

## 9. Ratings Endpoints

### GET /ratings
Pobierz oceny.

**Query Parameters**:
- `contentType` (required)
- `contentId` (required)

**Response** (200):
```json
{
  "average": 4.5,
  "count": 20,
  "distribution": {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 10
  },
  "userRating": 5 // Jeśli zalogowany
}
```

### POST /ratings
Dodaj/zaktualizuj ocenę.

**Auth**: JWT Required

**Body**:
```json
{
  "contentType": "ARTICLE",
  "contentId": "uuid",
  "value": 5
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "value": 5,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Curl**:
```bash
curl -X POST http://localhost:3001/api/ratings \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "ARTICLE",
    "contentId": "uuid",
    "value": 5
  }'
```

### DELETE /ratings/:id
Usuń ocenę.

**Auth**: JWT Required

## 10. Search Endpoints

### GET /search
Wyszukiwanie full-text.

**Auth**: Publiczny

**Query Parameters**:
- `q` (required): Query string
- `type`: ARTICLE | BLOG_POST | WIKI_PAGE | GALLERY_ITEM | STORY
- `category`: Slug kategorii
- `tag`: Slug tagu
- `author`: ID autora
- `page`, `limit`

**Response** (200):
```json
{
  "hits": [
    {
      "id": "uuid",
      "type": "ARTICLE",
      "title": "Search result title",
      "excerpt": "Highlighted excerpt...",
      "slug": "article-slug",
      "highlightedFields": {
        "title": "Search <em>result</em> title",
        "content": "...highlighted <em>content</em>..."
      },
      "score": 0.95
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3,
  "facets": {
    "type": {
      "ARTICLE": 15,
      "BLOG_POST": 10
    },
    "category": {
      "technology": 12,
      "science": 8
    }
  }
}
```

**Curl**:
```bash
curl -X GET "http://localhost:3001/api/search?q=javascript&type=ARTICLE&page=1"
```

### GET /search/autocomplete
Autouzupełnianie.

**Query Parameters**:
- `q` (required): Query string

**Response** (200):
```json
{
  "suggestions": [
    {
      "title": "JavaScript Basics",
      "slug": "javascript-basics",
      "type": "ARTICLE"
    },
    {
      "title": "Advanced JavaScript",
      "slug": "advanced-javascript",
      "type": "BLOG_POST"
    }
  ]
}
```

## 11. Categories Endpoints

### GET /categories
Lista kategorii (z hierarchią).

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Technology",
      "slug": "technology",
      "description": "Tech articles",
      "color": "#3B82F6",
      "icon": "laptop",
      "parent": null,
      "children": [
        {
          "id": "uuid",
          "name": "Programming",
          "slug": "programming"
        }
      ],
      "_count": {
        "articles": 25,
        "blogPosts": 15
      }
    }
  ]
}
```

### POST /categories
**Auth**: JWT Required (ADMIN)

### PUT /categories/:id
**Auth**: JWT Required (ADMIN)

### DELETE /categories/:id
**Auth**: JWT Required (ADMIN)

## 12. Tags Endpoints

Podobna struktura jak Categories.

### GET /tags
Lista tagów z licznikiem użyć.

### GET /tags/:slug
Tag z powiązanymi treściami.

## 13. Notifications Endpoints

### GET /notifications
Powiadomienia użytkownika.

**Auth**: JWT Required

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "COMMENT",
      "title": "New comment",
      "message": "Someone commented on your article",
      "isRead": false,
      "data": {
        "commentId": "uuid",
        "articleId": "uuid"
      },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "unreadCount": 5
}
```

### PATCH /notifications/:id/read
Oznacz jako przeczytane.

**Auth**: JWT Required

### PATCH /notifications/read-all
Oznacz wszystkie jako przeczytane.

**Auth**: JWT Required

## Kody Statusu HTTP

- **200** - OK
- **201** - Created
- **204** - No Content
- **400** - Bad Request (błąd walidacji)
- **401** - Unauthorized (brak/niewłaściwy token)
- **403** - Forbidden (brak uprawnień)
- **404** - Not Found
- **409** - Conflict (np. duplikat email)
- **422** - Unprocessable Entity
- **429** - Too Many Requests (rate limit)
- **500** - Internal Server Error

## Rate Limiting

- **Default**: 100 requests / 15 minutes
- **Auth endpoints**: 5 requests / 15 minutes
- **Upload endpoints**: 10 requests / hour

Header response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## Podsumowanie

API Multimedia Portal zapewnia:
- ✅ RESTful design
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Pagination
- ✅ Filtering & sorting
- ✅ Full-text search
- ✅ Rate limiting
- ✅ Comprehensive error handling

---

**Wersja**: 1.0.0
**Data**: 2025-11-07
