# Auto-Save Implementation Guide

## Overview

Auto-save functionality has been implemented using the ContentVersionsService to automatically save drafts every 30 seconds.

## Backend Implementation

### Articles Controller

The Articles controller has been updated with an auto-save endpoint:

**Endpoint:** `POST /articles/:id/autosave`
**Auth:** Admin/Moderator only
**Description:** Saves the current state of an article as a new version

### Implementation Pattern for Other Controllers

To add auto-save to BlogPosts, WikiPages, GalleryItems, and Stories controllers:

1. Import ContentVersionsModule in the module file:
```typescript
import { ContentVersionsModule } from '../content-versions/content-versions.module';

@Module({
  imports: [PrismaModule, ContentVersionsModule],
  // ...
})
```

2. Inject ContentVersionsService in the controller:
```typescript
import { ContentVersionsService } from '../content-versions/content-versions.service';
import { VersionableType } from '../content-versions/dto';

constructor(
  private readonly service: Service,
  private readonly contentVersionsService: ContentVersionsService,
) {}
```

3. Add auto-save endpoint:
```typescript
@Post(':id/autosave')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@ApiBearerAuth()
@ApiOperation({ summary: 'Auto-save [content type] as a version' })
@ApiParam({ name: 'id', description: '[Content type] ID' })
@HttpCode(HttpStatus.CREATED)
async autosave(
  @Param('id') id: string,
  @CurrentUser('id') userId: string,
) {
  const content = await this.service.findOne(id);

  return this.contentVersionsService.autoSaveVersion(
    userId,
    VersionableType.[CONTENT_TYPE],
    id,
    content.title,
    content.content,
    content.excerpt || undefined,
    {
      // Additional metadata specific to content type
      featuredImage: content.featuredImage,
      status: content.status,
    },
    'Auto-saved draft',
  );
}
```

### Content Type Mapping

- Articles: `VersionableType.ARTICLE`
- BlogPosts: `VersionableType.BLOG_POST`
- WikiPages: `VersionableType.WIKI_PAGE`
- GalleryItems: `VersionableType.GALLERY_ITEM`
- Stories: `VersionableType.STORY`

## Frontend Implementation

### Auto-Save Timer

The frontend should implement a timer that calls the auto-save endpoint every 30 seconds:

```typescript
// Example: React implementation
useEffect(() => {
  if (!contentId || !isDraft) return;

  const autoSaveInterval = setInterval(async () => {
    try {
      await axios.post(`/api/articles/${contentId}/autosave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 30000); // 30 seconds

  return () => clearInterval(autoSaveInterval);
}, [contentId, isDraft, token]);
```

### Auto-Save Indicator

Display an indicator to show when content is being saved:

```typescript
const [autoSaving, setAutoSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

const autoSave = async () => {
  setAutoSaving(true);
  try {
    await axios.post(`/api/articles/${contentId}/autosave`);
    setLastSaved(new Date());
  } catch (error) {
    console.error('Auto-save failed:', error);
  } finally {
    setAutoSaving(false);
  }
};

// UI
{autoSaving && <span>Saving...</span>}
{lastSaved && <span>Last saved: {formatRelativeTime(lastSaved)}</span>}
```

### Best Practices

1. **Only auto-save drafts**: Don't auto-save published content to avoid unwanted versions
2. **Debounce user input**: Wait for user to stop typing before triggering auto-save
3. **Show save status**: Display "Saving...", "Saved", or error messages
4. **Handle conflicts**: Check for version conflicts before saving
5. **Offline support**: Queue auto-saves if offline, sync when online

## Version History Integration

All auto-saved versions are stored in the `content_versions` table and can be:

- Viewed via `GET /content-versions/:contentType/:contentId`
- Compared via `GET /content-versions/:contentType/:contentId/compare/:vA/:vB`
- Restored via `GET /content-versions/:contentType/:contentId/restore/:versionNumber`

## Storage Management

To prevent version table bloat:

- Use `DELETE /content-versions/:contentType/:contentId/prune?keepCount=10` to keep only the latest N versions
- Recommended: Run a cron job to prune old versions periodically
- Default: Keep last 10 versions per content item

## Testing

### Manual Testing

1. Create a draft article via POST /articles
2. Make changes to the article
3. Call POST /articles/:id/autosave every 30 seconds
4. Verify versions are created via GET /content-versions/ARTICLE/:id
5. Compare versions to see changes
6. Restore a previous version if needed

### Automated Testing

```typescript
describe('Auto-save', () => {
  it('should auto-save article draft', async () => {
    const article = await createDraftArticle();
    const response = await request(app)
      .post(`/articles/${article.id}/autosave`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(response.body).toHaveProperty('versionNumber');
  });

  it('should increment version number on each save', async () => {
    const article = await createDraftArticle();

    const v1 = await autosave(article.id);
    expect(v1.versionNumber).toBe(1);

    const v2 = await autosave(article.id);
    expect(v2.versionNumber).toBe(2);
  });
});
```

## Security Considerations

- Auto-save endpoints require authentication (JWT)
- Only Admin and Moderator roles can trigger auto-save
- Content existence is verified before creating versions
- Rate limiting should be applied to prevent abuse

## Performance Optimization

1. **Async Processing**: Version creation is non-blocking
2. **Selective Storage**: Only store content, title, excerpt, and metadata
3. **Pruning**: Regular cleanup prevents table bloat
4. **Indexing**: Database indexes on contentType and contentId for fast queries

## Future Enhancements

- [ ] Add real-time collaboration with conflict resolution
- [ ] Implement draft branches for major changes
- [ ] Add version tagging (e.g., "major edit", "minor fix")
- [ ] Implement automatic merging of similar versions
- [ ] Add version diff visualization in frontend
- [ ] Implement version rollback with one click
