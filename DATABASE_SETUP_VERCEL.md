# 🗄️ Database Setup for Vercel Deployment

## 🎯 **Quick Setup - PostgreSQL on Vercel**

### **Step 1: Create PostgreSQL Database**
1. Go to your **Vercel Dashboard**
2. Click your project → **Storage** tab
3. Click **"Create Database"** → **"Postgres"**
4. Choose **"Hobby"** plan (FREE)
5. Click **"Create"**

### **Step 2: Copy Connection String**
After creation, you'll see:
- **DATABASE_URL**: `postgresql://username:password@host:port/database`
- Copy this entire string

### **Step 3: Set Environment Variables**
In your Vercel project → **Settings** → **Environment Variables**, add:

```
DATABASE_URL=postgresql://your_connection_string_here
JWT_SECRET=your-super-secure-production-secret-key-2024
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
YOUTUBE_API_KEY=your_youtube_api_key_optional
```

### **Step 4: Deploy**
1. Push code changes to GitHub (schema update)
2. Vercel will auto-deploy with new database

---

## 🚀 **Alternative: Free PostgreSQL Options**

### **Option 1: Supabase (Recommended)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Free tier: 500MB, 2 CPU hours

### **Option 2: Neon Database**
1. Go to [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string
4. Free tier: 3GB storage

### **Option 3: Railway PostgreSQL**
1. Go to [railway.app](https://railway.app)
2. New Project → Add PostgreSQL
3. Get connection from Variables tab
4. $5/month free credits

---

## 🔧 **Database Schema Setup**

The app will automatically:
1. Generate Prisma client
2. Push schema to PostgreSQL
3. Create all tables
4. Ready for users!

### **Tables Created:**
- ✅ `users` - User accounts
- ✅ `playlists` - User playlists  
- ✅ `playlist_tracks` - Songs in playlists
- ✅ `liked_songs` - User liked songs
- ✅ `search_history` - Search history

---

## 🎉 **After Database Setup**

### **Your app will have:**
- ✅ Working user registration/login
- ✅ Persistent user data
- ✅ Saved playlists
- ✅ Liked songs storage
- ✅ Search history

### **Demo User Creation**
After deployment, you can create the demo user with:

```sql
-- Run in your database console
INSERT INTO users (id, email, username, password, created_at)
VALUES (
  'demo-user-id',
  'demo@viewly.com', 
  'DemoUser',
  '$2b$10$hash_of_demo123',
  NOW()
);
```

---

## 🚨 **Important Notes**

1. **SQLite → PostgreSQL**: We switched from SQLite (file-based) to PostgreSQL (cloud-based)
2. **No Data Loss**: This is a new deployment, so no existing data to migrate
3. **Automatic Setup**: Vercel handles the database creation and connection
4. **Free Tier**: All recommended options have generous free tiers

---

## 🎯 **Next Steps**

1. ✅ Database schema updated to PostgreSQL
2. ✅ Build script updated for Vercel
3. 📝 **YOU DO**: Set up PostgreSQL database on Vercel
4. 📝 **YOU DO**: Add DATABASE_URL to environment variables
5. 🚀 **DEPLOY**: Push to GitHub and let Vercel deploy

**Your music app will be fully functional with persistent user data!** 🎵