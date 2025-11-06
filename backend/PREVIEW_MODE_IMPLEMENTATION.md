# Preview Mode Implementation Guide

## Overview

Preview mode allows Admin and Moderator users to view content regardless of its publication status (DRAFT, PENDING_REVIEW, SCHEDULED, PUBLISHED, ARCHIVED).

## Backend Implementation

### Articles Controller

The Articles controller has been updated with a preview endpoint:

**Endpoint:** `GET /articles/:id/preview`
**Auth:** Admin/Moderator only
**Description:** Retrieves article content regardless of status

### Implementation Pattern for Other Controllers

To add preview mode to BlogPosts, WikiPages, GalleryItems, and Stories controllers:

```typescript
@Get(':id/preview')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@ApiBearerAuth()
@ApiOperation({ summary: 'Preview [content type] regardless of status (Admin/Moderator only)' })
@ApiParam({ name: 'id', description: '[Content type] ID' })
@ApiResponse({ status: 200, description: 'Preview retrieved successfully' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden' })
@ApiResponse({ status: 404, description: '[Content type] not found' })
async preview(@Param('id') id: string) {
  // Retrieve content regardless of status
  return this.service.findOne(id);
}
```

### Key Differences from Public Endpoints

| Feature | Public Endpoint | Preview Endpoint |
|---------|----------------|------------------|
| Route | `GET /:identifier` | `GET /:id/preview` |
| Auth | None (@Public) | Admin/Moderator only |
| Status Filter | Only PUBLISHED | All statuses |
| Use Case | Public viewing | Draft preview |

## Frontend Implementation

### Preview Page Route

Create a dedicated preview route in your frontend:

```typescript
// Example: Next.js
// pages/articles/preview/[id].tsx

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ArticlePreview() {
  const router = useRouter();
  const { id } = router.query;
  const { token, user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) return;

    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/articles/${id}/preview`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setArticle(data);
        } else {
          console.error('Failed to load preview');
        }
      } catch (error) {
        console.error('Preview error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [id, token]);

  if (loading) return <div>Loading preview...</div>;
  if (!article) return <div>Preview not found</div>;

  return (
    <div className="preview-mode">
      <div className="preview-banner">
        <span>Preview Mode</span>
        <span className="status-badge">{article.status}</span>
      </div>

      <article>
        <h1>{article.title}</h1>
        {article.excerpt && <p className="excerpt">{article.excerpt}</p>}
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>
    </div>
  );
}
```

### Preview Banner Component

Add a visual indicator that the user is in preview mode:

```typescript
// components/PreviewBanner.tsx

interface PreviewBannerProps {
  status: 'DRAFT' | 'PENDING_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  contentType: string;
  contentId: string;
}

export function PreviewBanner({ status, contentType, contentId }: PreviewBannerProps) {
  const statusColors = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    PENDING_REVIEW: 'bg-blue-100 text-blue-800',
    SCHEDULED: 'bg-purple-100 text-purple-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="sticky top-0 z-50 bg-gray-900 text-white py-3 px-6 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">👁️ Preview Mode</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.href = `/admin/${contentType}/${contentId}/edit`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Edit
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Preview Link Generation

Generate preview links in the admin interface:

```typescript
// In article editor component

function generatePreviewLink(articleId: string): string {
  return `${window.location.origin}/articles/preview/${articleId}`;
}

// Preview button
<button
  onClick={() => {
    const previewUrl = generatePreviewLink(article.id);
    window.open(previewUrl, '_blank');
  }}
  className="preview-button"
>
  👁️ Preview
</button>

// Copy preview link
<button
  onClick={() => {
    const link = generatePreviewLink(article.id);
    navigator.clipboard.writeText(link);
    alert('Preview link copied!');
  }}
>
  📋 Copy Preview Link
</button>
```

## Security Considerations

### Authentication Required

- Preview endpoints require JWT authentication
- Only Admin and Moderator roles can access previews
- Unauthorized access returns 401 or 403 status codes

### Role-Based Access Control

```typescript
// Recommended: Add additional checks in the service layer

async preview(userId: string, contentId: string) {
  const content = await this.findOne(contentId);

  // Optional: Check if user has permission to preview this specific content
  if (content.userId !== userId && user.role !== 'ADMIN') {
    throw new ForbiddenException('You can only preview your own drafts');
  }

  return content;
}
```

### Preventing Search Engine Indexing

Add meta tags to preview pages:

```html
<!-- In preview page head -->
<meta name="robots" content="noindex, nofollow" />
<meta name="googlebot" content="noindex, nofollow" />
```

## Use Cases

### 1. Content Review

Moderators can review draft content before approval:

```typescript
// Admin dashboard: Pending review queue
const pendingContent = await fetch('/api/articles?status=PENDING_REVIEW');

// For each item, provide preview link
pendingContent.map(article => (
  <div key={article.id}>
    <h3>{article.title}</h3>
    <button onClick={() => previewArticle(article.id)}>
      Preview
    </button>
    <button onClick={() => approveArticle(article.id)}>
      Approve
    </button>
  </div>
));
```

### 2. Scheduled Content Preview

Preview scheduled content before it goes live:

```typescript
// Admin dashboard: Scheduled content
const scheduledArticle = await fetch(`/api/articles/${id}/preview`);

return (
  <div>
    <PreviewBanner status="SCHEDULED" />
    <p>Scheduled for: {scheduledArticle.scheduledPublishAt}</p>
    <ArticleDisplay article={scheduledArticle} />
  </div>
);
```

### 3. Draft Sharing

Share draft previews with team members:

```typescript
// Generate shareable preview link (requires authentication)
const sharePreview = async (articleId: string) => {
  const link = `${baseUrl}/articles/preview/${articleId}`;

  // Copy to clipboard or send via email
  await navigator.clipboard.writeText(link);

  // Optionally: Send email with preview link
  await sendEmail({
    to: 'reviewer@example.com',
    subject: 'Review Draft Article',
    body: `Please review this draft: ${link}`,
  });
};
```

## Testing

### Manual Testing

1. Create a draft article via POST /articles
2. Get article ID from response
3. Access preview endpoint: GET /articles/:id/preview with Auth header
4. Verify article is returned regardless of DRAFT status
5. Try accessing without authentication (should fail)
6. Try accessing with non-Admin/Moderator role (should fail)

### Automated Testing

```typescript
describe('Preview Mode', () => {
  it('should allow admin to preview draft article', async () => {
    const article = await createDraftArticle();

    const response = await request(app)
      .get(`/articles/${article.id}/preview`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.id).toBe(article.id);
    expect(response.body.status).toBe('DRAFT');
  });

  it('should deny preview access to regular users', async () => {
    const article = await createDraftArticle();

    await request(app)
      .get(`/articles/${article.id}/preview`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should require authentication for preview', async () => {
    const article = await createDraftArticle();

    await request(app)
      .get(`/articles/${article.id}/preview`)
      .expect(401);
  });
});
```

## Integration with Workflow

### Status-Specific Previews

Show different UI elements based on content status:

```typescript
function PreviewArticle({ article }) {
  const renderStatusBanner = () => {
    switch (article.status) {
      case 'DRAFT':
        return <div className="banner-draft">Draft - Not published</div>;
      case 'PENDING_REVIEW':
        return <div className="banner-review">Awaiting review</div>;
      case 'SCHEDULED':
        return (
          <div className="banner-scheduled">
            Scheduled for {formatDate(article.scheduledPublishAt)}
          </div>
        );
      case 'PUBLISHED':
        return <div className="banner-published">Published</div>;
      case 'ARCHIVED':
        return <div className="banner-archived">Archived - Not visible</div>;
    }
  };

  return (
    <div>
      {renderStatusBanner()}
      <article>{/* Article content */}</article>
    </div>
  );
}
```

### Version Preview

Preview specific versions from version history:

```typescript
// Combined with content versions
const previewVersion = async (
  contentType: string,
  contentId: string,
  versionNumber: number
) => {
  // Get version data
  const version = await fetch(
    `/api/content-versions/${contentType}/${contentId}/${versionNumber}`
  );

  // Display version in preview mode
  return {
    ...version,
    isVersionPreview: true,
    versionNumber,
  };
};
```

## Best Practices

1. **Always show preview indicator**: Users should know they're viewing unpublished content
2. **Link to edit page**: Provide easy access to edit the content
3. **Display metadata**: Show status, scheduled time, version number, etc.
4. **Respect permissions**: Only allow authorized users to preview
5. **Prevent indexing**: Add noindex meta tags to preview pages
6. **Log preview access**: Track who previewed what content
7. **Cache invalidation**: Ensure previews show latest changes

## Future Enhancements

- [ ] Shareable preview tokens for external reviewers
- [ ] Time-limited preview access
- [ ] Preview analytics (who viewed, when, for how long)
- [ ] Side-by-side comparison with published version
- [ ] Mobile preview mode
- [ ] SEO preview with meta tags simulation
- [ ] Social media preview (Open Graph, Twitter Cards)
