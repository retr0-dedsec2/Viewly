# 🚀 Deploy Viewly to Vercel - Quick Steps

## Step 1: Setup PostgreSQL Database

### Option A: Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Storage** tab
3. Click **Create Database** → **Postgres**
4. Choose **Hobby** plan (FREE)
5. Copy the **DATABASE_URL** connection string

### Option B: Supabase (Alternative)
1. Go to [Supabase](https://supabase.com) → Create project
2. Go to Settings → Database → Connection string
3. Copy the **PostgreSQL** connection string

## Step 2: Set Environment Variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

```
DATABASE_URL=postgresql://your_connection_string_here
YOUTUBE_API_KEY=AIzaSyBGVqjX3NrKWuvg2gehD-ymcYnMGePFI_o
JWT_SECRET=904c4aa4b1a561d1a6e008a980bc3837515bd03605d5db3be6b31a1a6d3707ea3bcb232932c38964e5e89b9642ebdd2bd508117f101f729cea5b190611a5de9e
NEXT_PUBLIC_PARSE_APP_ID=c9u4nTsj0l8VwOaJXt58ZsqYagIZGFeC9j4xyNZ0
NEXT_PUBLIC_PARSE_JS_KEY=EdDdriNyRPCQx3N3WGuWOXKdLzy3USihb7IiOnvp
NEXT_PUBLIC_PARSE_SERVER_URL=https://parseapi.back4app.com
```

## Step 3: Deploy

1. **Commit and push** these changes to GitHub
2. Vercel will **automatically deploy**
3. The build process will:
   - ✅ Generate Prisma client for PostgreSQL
   - ✅ Create database tables
   - ✅ Deploy your app

## Step 4: Test

After deployment:
1. Visit your Vercel app URL
2. Register a new account
3. Test AI playlist creation - it will now save to PostgreSQL!

---

## 🎯 What Changed

- ✅ **Database**: SQLite → PostgreSQL (for Vercel compatibility)
- ✅ **AI Playlist Creation**: Now properly saves to database
- ✅ **Build Process**: Works on Vercel without errors
- ✅ **User Data**: Persistent across deployments

Your Viewly music app is ready for production! 🎵