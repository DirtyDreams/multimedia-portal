# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Multimedia Portal** built with:
- **Backend**: NestJS + TypeORM (Node.js 18+, PostgreSQL)
- **Frontend**: Next.js 14 with React 18, Tailwind CSS, TypeScript
- **Admin Panel**: Full-featured CMS interface within Next.js

The portal supports multiple content types (Articles, Blog, Wiki, Gallery, Stories, Authors) with cross-content commenting, ratings, and sharing. User authentication uses JWT with role-based access control (user, moderator, admin).

## Architecture Overview

### Backend Structure (NestJS)
- **Modules**: One module per major feature (Articles, BlogPosts, WikiPages, GalleryItems, Stories, Authors, Comments, Ratings, Authentication, Admin)
- **Database**: TypeORM ORM with PostgreSQL
- **Security**: JWT guards, role-based access control (RolesGuard), custom pipes for validation
- **API Pattern**: RESTful endpoints with service layer pattern
- **Key Services**: Controllers → Services → Repository (TypeORM)

### Frontend Structure (Next.js 14 App Router)
- **Layout**: App Router with nested routes for content sections and admin dashboard
- **Admin Panel**: Located under `/dashboard` route with CRUD interfaces for all content types
- **Data Fetching**: SWR or React Query for client-side data management
- **Components**: Shared components (Navigation, Footer, CommentsSection, RatingWidget, etc.) + page-specific components
- **Styling**: Tailwind CSS for utility-first styling

### Key Relationships
- Content entities (Articles, BlogPosts, etc.) have many Comments and Ratings
- All content supports categories and tags
- Wiki has hierarchical structure (parent-child relationships)
- Authors can have multiple pieces of content

## Task Master AI Integration

This project uses **Task Master AI** for workflow management. Task Master is already initialized and configured.

### Essential Commands
```bash
# View tasks
task-master list                                   # Show all tasks
task-master show <id>                             # View task details (e.g., 1, 2.1)
task-master next                                  # Get next available task

# Manage task status
task-master set-status --id=<id> --status=done    # Mark task complete
task-master set-status --id=<id> --status=in-progress  # Start working on task

# Update implementation details
task-master update-subtask --id=<id> --prompt="notes"  # Log progress/findings

# Task analysis
task-master analyze-complexity                    # Analyze task complexity
task-master complexity-report                     # View analysis results

# MCP Tools (also available as Tools in Claude Code)
# Alternative: use mcp__taskmaster-ai__* tools directly
```

The PRD is located in `prd.txt` and has already been parsed into tasks. For complex tasks, use `task-master expand --id=<id>` to break them into subtasks.

## Development Workflow

### 1. Backend Development
```bash
# Install dependencies (if needed)
npm install --prefix backend

# Database setup
# Edit DATABASE_URL in .env
# Run migrations (commands vary by setup)

# Development server
npm run start:dev --prefix backend   # Watch mode with auto-reload

# Build
npm run build --prefix backend

# Testing
npm test --prefix backend            # Run all tests
npm test <filename> --prefix backend  # Run specific test
```

### 2. Frontend Development
```bash
# Install dependencies (if needed)
npm install --prefix frontend

# Development server
npm run dev --prefix frontend        # Runs on http://localhost:3000

# Build
npm run build --prefix frontend

# Testing
npm test --prefix frontend
```

### 3. Docker Development
```bash
# Start entire stack
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down
```

## Database Schema Highlights

### Content Types (Core Entities)
- **Articles**: Title, content, categories, tags, author
- **BlogPosts**: Title, content, categories, tags, author
- **WikiPages**: Title, content, parent (hierarchy), author
- **GalleryItems**: Files (images/videos), categories, tags, descriptions
- **Stories**: Title, content, series, categories, tags, author
- **Authors**: Name, bio, profile image, contact info

### Cross-Content Entities
- **Comments**: Content type discriminator, content ID, user, text, nested replies
- **Ratings**: Content type discriminator, content ID, user, rating (1-5)
- **Categories & Tags**: Reusable across all content types

## Frontend Routes

### Public Routes
- `/` - Landing page
- `/login` - Authentication
- `/register` - User registration
- `/blog`, `/blog/[slug]` - Blog content
- `/articles`, `/articles/[slug]` - Articles
- `/wiki`, `/wiki/[slug]` - Wiki pages with hierarchical navigation
- `/gallery`, `/gallery/[id]` - Media gallery
- `/stories`, `/stories/[slug]` - Stories
- `/authors`, `/authors/[slug]` - Author profiles

### Admin Routes (Protected)
- `/dashboard` - Overview and statistics
- `/dashboard/articles` - Articles CRUD
- `/dashboard/blog` - Blog posts CRUD
- `/dashboard/wiki` - Wiki hierarchical editor
- `/dashboard/gallery` - Gallery management
- `/dashboard/stories` - Stories CRUD
- `/dashboard/authors` - Authors CRUD
- `/dashboard/users` - User management
- `/dashboard/comments` - Comment moderation
- `/dashboard/settings` - Portal settings

## API Endpoints (NestJS)

### Content Management
- `GET/POST /api/articles`, `GET/PUT/DELETE /api/articles/:id`
- `GET/POST /api/blog`, `GET/PUT/DELETE /api/blog/:id`
- `GET/POST /api/wiki`, `GET/PUT/DELETE /api/wiki/:id`
- `GET/POST /api/gallery`, `DELETE /api/gallery/:id`
- `GET/POST /api/stories`, `GET/PUT/DELETE /api/stories/:id`
- `GET/POST /api/authors`, `GET/PUT/DELETE /api/authors/:id`

### Comments & Ratings
- `GET/POST /api/comments`, `DELETE /api/comments/:id`
- `GET/POST /api/ratings`, `PUT /api/ratings/:id`

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Current user info

### Admin
- `GET /api/admin/dashboard` - Statistics
- `GET/POST/PUT/DELETE /api/admin/users` - User management
- `GET/DELETE /api/admin/comments` - Comment moderation
- `GET/PUT /api/admin/settings` - Portal settings

## Key Development Considerations

### Authentication & Authorization
- JWT tokens in Authorization header
- Guards check roles (user, moderator, admin)
- Admin panel requires admin role
- Comments/ratings require authenticated user

### Content Hierarchy
- Wiki supports nested structures (parent-child pages)
- Stories can belong to series
- All content has categories and tags for organization

### Cross-Content Features
- Comments work on Articles, BlogPosts, WikiPages, GalleryItems, Stories
- Ratings (1-5 stars) available on all content
- Share buttons and social media integration planned

### Performance Considerations
- Image optimization in Next.js
- Lazy loading for media
- Pagination for list endpoints
- Database indexing on frequently queried fields
- Optional Redis caching layer

### Security Best Practices
- JWT tokens for stateless authentication
- CORS configuration in NestJS
- Input validation with class-validator
- SQL injection prevention via TypeORM
- XSS prevention (React built-in, sanitization for rich text)
- CSRF tokens (configure in NestJS middleware)
- Role-based access control throughout

## File Organization Tips

### Backend
- Controllers handle HTTP requests and validation
- Services contain business logic and database queries
- Entities define database schema via TypeORM decorators
- Guards handle authentication/authorization
- Pipes validate/transform request data
- Migrations track schema changes

### Frontend
- Shared components in `/app/components` or similar
- Page components in `/app` directory with App Router
- Admin components grouped in dashboard folder
- Custom hooks for data fetching and state
- Types/interfaces for type safety

## Common Tasks

### Adding a New Content Type
1. Create TypeORM entity with relationships
2. Create NestJS module with controller/service
3. Add API endpoints (GET list, GET detail, POST, PUT, DELETE)
4. Create React components for display
5. Add admin CRUD interface in dashboard

### Implementing Content Search/Filter
1. Add query parameters to API endpoint
2. Use TypeORM QueryBuilder for filtering
3. Implement pagination
4. Create filter UI components in frontend

### Setting Up Content Relationships
1. Define TypeORM relationships (@OneToMany, @ManyToMany)
2. Run database migration
3. Update service methods to populate relations
4. Update API responses to include related data

## GitHub Integration & Workflow

**This project MUST use GitHub for all development work.** All changes must be tracked through git commits and pull requests.

### Essential GitHub Commands
```bash
# View repository information
gh repo view                              # View repo details
gh repo clone owner/repo                  # Clone repository
gh repo create                            # Create new repository

# Branch management
gh repo list                              # List repositories
git checkout -b feature/branch-name       # Create feature branch
git push -u origin feature/branch-name    # Push to remote

# Pull Requests (MANDATORY WORKFLOW)
gh pr create --title "..." --body "..."   # Create PR
gh pr view <pr-number>                    # View PR details
gh pr list                                # List open PRs
gh pr merge <pr-number>                   # Merge PR
gh pr review <pr-number>                  # Review PR

# Issue tracking
gh issue create --title "..." --body "..."  # Create issue
gh issue list                               # List issues
gh issue view <issue-number>                # View issue details

# Commit workflow
git add .                                 # Stage changes
git commit -m "feat: descriptive message" # Create commit
git push                                  # Push changes
```

### Workflow Guidelines
1. **Always create a branch** for new features: `git checkout -b feature/feature-name`
2. **Commit regularly** with clear, descriptive messages following conventional commits
3. **Push to GitHub** before starting pull requests
4. **Create Pull Requests** for code review before merging to main
5. **Use GitHub Issues** for tracking bugs, features, and tasks
6. **Link commits to issues** using `#issue-number` in commit messages
7. **Request reviews** on all PRs using `gh pr create` or web interface

### Conventional Commit Format
```
type(scope): description

feat(articles): add new article type support
fix(auth): resolve JWT token expiration issue
docs(api): update endpoint documentation
refactor(db): optimize query performance
test(comments): add comment service tests
```

## Web Research & Content Scraping

When you need to search the internet or extract data from websites, use **MCP_DOCKER** tools powered by DuckDuckGo:

### Available Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| **mcp__MCP_DOCKER__searchscraper** | Search and scrape results | Finding articles, research, content for wiki/gallery |
| **mcp__MCP_DOCKER__smartscraper** | Extract structured data from web | Extracting article data, author info, media metadata |
| **mcp__MCP_DOCKER__smartcrawler_initiate** | Multi-page intelligent crawling | Crawling entire websites, collecting content |
| **mcp__MCP_DOCKER__smartcrawler_fetch_results** | Fetch crawling results | Retrieving collected data from crawl operations |
| **mcp__MCP_DOCKER__markdownify** | Convert HTML to Markdown | Converting web content for wiki/articles |

### Examples

**Search for articles:**
```
mcp__MCP_DOCKER__searchscraper with query about topic
```

**Extract data from a webpage:**
```
mcp__MCP_DOCKER__smartscraper to extract author info, article metadata
```

**Convert web content to Markdown:**
```
mcp__MCP_DOCKER__markdownify to convert HTML article to Markdown format
```

### When to Use
- Researching content for wiki pages
- Gathering author information
- Finding media sources for gallery
- Extracting article data from external sources
- Converting web content to portal format

## YouTube Content & Transcription

Use **YouTube transcription tools** for extracting content, research, and creating documentation:

### Available Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| **mcp__MCP_DOCKER__get_transcript** | Extract video transcript | Getting full text from educational videos |
| **mcp__MCP_DOCKER__get_timed_transcript** | Extract transcript with timestamps | Creating timestamped guides, tutorials, documentation |
| **mcp__MCP_DOCKER__get_video_info** | Get video metadata | Extracting title, description, channel info for wiki/articles |

### Examples

**Get transcript from YouTube video:**
```
mcp__MCP_DOCKER__get_transcript with URL: https://www.youtube.com/watch?v=xyz
```

**Get timestamped transcript:**
```
mcp__MCP_DOCKER__get_timed_transcript with URL: https://www.youtube.com/watch?v=xyz
```

**Extract video metadata:**
```
mcp__MCP_DOCKER__get_video_info with URL: https://www.youtube.com/watch?v=xyz
```

### When to Use
- Creating wiki articles from tutorial videos
- Extracting educational content
- Converting video guides to text documentation
- Building gallery descriptions from video content
- Creating author/creator profiles
- Documenting technical concepts from video tutorials

### Language Support
- Default language: English (`en`)
- Supports multiple languages via `lang` parameter
- Available languages: Check video's available transcripts

## Advanced Research & Analysis Tools

### Sequential Thinking (Deep Analysis)
Use **mcp__MCP_DOCKER__sequentialthinking** for complex problem-solving and deep analysis:

**When to use:**
- Breaking down complex architectural problems
- Planning major feature implementations
- Debugging difficult issues with multiple considerations
- Analyzing performance bottlenecks
- Making design decisions with multiple trade-offs

**Features:**
- Flexible thinking process that adapts as understanding deepens
- Ability to revise previous thoughts and branch into new approaches
- Express uncertainty and explore alternatives
- Generate and verify solution hypotheses
- Multi-step problem solving with context preservation

**Example usage:**
```
Use sequential thinking to:
1. Analyze database schema optimization options
2. Consider performance implications
3. Review trade-offs between approaches
4. Verify final solution against requirements
```

### Library Documentation Tools
Use these tools to fetch and resolve library documentation:

| Tool | Purpose | Use Case |
|------|---------|----------|
| **mcp__MCP_DOCKER__resolve-library-id** | Resolve library name to Context7 ID | Finding correct library identifiers (e.g., `/mongodb/docs`, `/vercel/next.js`) |
| **mcp__MCP_DOCKER__get-library-docs** | Fetch library documentation | Getting up-to-date docs for dependencies (NestJS, TypeORM, Next.js, etc.) |

**Workflow:**
1. Use `resolve-library-id` to find the correct library ID
2. Use `get-library-docs` with that ID to fetch documentation

**Examples:**

```bash
# Find library ID for NestJS
mcp__MCP_DOCKER__resolve-library-id with libraryName: "NestJS"
# Returns: /nestjs/docs

# Get NestJS documentation on specific topic
mcp__MCP_DOCKER__get-library-docs with:
  context7CompatibleLibraryID: "/nestjs/docs"
  topic: "guards and authentication"
```

**Common Libraries:**
- `/nestjs/docs` - NestJS framework
- `/typeorm/typeorm` - TypeORM ORM
- `/vercel/next.js` - Next.js framework
- `/react/react` - React library
- `/tailwindlabs/tailwindcss` - Tailwind CSS

## Useful Links

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com)
- [Task Master AI](https://github.com/task-master-ai/task-master-ai)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
