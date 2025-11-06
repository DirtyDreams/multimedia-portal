# Prisma Migration Guide

## When Database is Available

Once you have a PostgreSQL database running, follow these steps:

### 1. Configure Database Connection

Update your `.env` file with the correct database URL:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
```

### 2. Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This generates the Prisma Client based on your schema.

### 3. Run Initial Migration

```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables in your database
- Create the migration history
- Generate/update Prisma Client

### 4. Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Open Prisma Studio to view data
npx prisma studio
```

## Troubleshooting

### Engine Download Issues

If you encounter issues downloading Prisma engines:

```bash
# Set environment variable to ignore checksum verification
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Then run commands
npx prisma generate
npx prisma migrate dev
```

### Connection Issues

- Verify PostgreSQL is running
- Check firewall settings
- Verify credentials in `.env`
- Test connection:
  ```bash
  psql "postgresql://username:password@host:port/database_name"
  ```

### Schema Changes

After modifying `schema.prisma`:

1. Create a new migration:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. The migration will be applied automatically in development

3. For production:
   ```bash
   npx prisma migrate deploy
   ```

## Production Deployment

### Using Docker

If using Docker Compose (recommended):

```bash
# Start all services including PostgreSQL
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### Manual Deployment

1. Ensure DATABASE_URL points to production database
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Restart your application

## Database Seeding

Create a seed script in `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      password: 'hashed_password', // Use bcrypt
      name: 'Administrator',
      role: 'ADMIN',
    },
  });

  // Add more seed data...
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seeding:
```bash
npx prisma db seed
```

## Next Steps

After successful migration:

1. ✅ Implement Prisma service in NestJS
2. ✅ Create repositories for each model
3. ✅ Implement CRUD operations
4. ✅ Add validation and error handling
5. ✅ Implement authentication with JWT
6. ✅ Create API endpoints

See the main README.md for implementation details.
