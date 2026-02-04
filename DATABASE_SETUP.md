# Database Setup Guide

VentureClaw requires a PostgreSQL database. This guide covers setup options from quick local development to production-ready cloud solutions.

## Quick Start: Neon (Recommended for Production)

[Neon](https://neon.tech) offers a free PostgreSQL database perfect for this project.

### Steps:

1. **Sign up for Neon** (free tier available)
   - Visit: https://neon.tech
   - Sign up with GitHub or email

2. **Create a new project**
   - Project name: `ventureclaw`
   - Region: Choose closest to your users

3. **Copy your connection string**
   - Go to Dashboard → Connection Details
   - Copy the connection string (starts with `postgresql://`)

4. **Update `.env.local`**
   ```bash
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

5. **Run migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Verify connection**
   ```bash
   npx prisma studio
   ```

## Alternative: Supabase

Supabase also offers a free PostgreSQL database with additional features.

### Steps:

1. Visit https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (Transaction mode)
5. Update `.env.local` with your DATABASE_URL
6. Run migrations (step 5 above)

## Alternative: Railway

Railway provides easy PostgreSQL setup with generous free tier.

### Steps:

1. Visit https://railway.app
2. Create new project → Add PostgreSQL
3. Copy connection string from Variables tab
4. Update `.env.local`
5. Run migrations

## Local Development: Docker

If you prefer local development:

```bash
# Create docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ventureclaw
      POSTGRES_PASSWORD: dev_password_change_in_prod
      POSTGRES_DB: ventureclaw
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start PostgreSQL
docker-compose up -d

# Update .env.local
echo 'DATABASE_URL="postgresql://ventureclaw:dev_password_change_in_prod@localhost:5432/ventureclaw"' >> .env.local

# Run migrations
npx prisma migrate dev --name init
```

## Environment Variables Needed

Add these to your `.env.local`:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://..."

# NextAuth.js (REQUIRED)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# OAuth Providers (Optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email (Optional - for magic links)
RESEND_API_KEY="re_..."

# OpenAI (Required for AI features)
OPENAI_API_KEY="sk-proj-..."
```

## Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output and add to `.env.local`:
```bash
NEXTAUTH_SECRET="your-generated-secret-here"
```

## OAuth Setup (Optional)

### Google OAuth:
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret

### GitHub OAuth:
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Create new OAuth app
3. Homepage: `http://localhost:3000`
4. Callback: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and generate Client Secret

## Running Migrations

After setting up your database:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Open Prisma Studio to view/edit data
npx prisma studio
```

## Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Make sure `.env.local` exists and contains DATABASE_URL
- Try copying to `.env`: `cp .env.local .env`

### "Can't reach database server"
- Check your connection string is correct
- For Neon/Supabase: Ensure `?sslmode=require` is appended
- For local: Ensure PostgreSQL/Docker is running

### Migration fails
- Check PostgreSQL version (needs 12+)
- Ensure database user has CREATE permissions
- Try: `npx prisma migrate reset` (⚠️ deletes all data)

## Production Deployment (Vercel)

1. Deploy to Vercel: `vercel`
2. Add environment variables in Vercel dashboard
3. Migrations run automatically on deploy
4. Or run manually: `vercel env pull && npx prisma migrate deploy`

## Next Steps

Once database is set up:

1. ✅ Run migrations
2. ✅ Start dev server: `npm run dev`
3. ✅ Visit http://localhost:3000
4. ✅ Sign up for an account
5. ✅ Submit a pitch and test the dashboard

---

**Need help?** Check the [Prisma docs](https://www.prisma.io/docs) or [NextAuth.js docs](https://next-auth.js.org).
