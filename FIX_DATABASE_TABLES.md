# 🔧 Fix Database Tables Error

## 🚨 **Current Issue**
Error: `The table public.users does not exist in the current database`

## ✅ **Solution - Create Database Tables**

### **Step 1: Ensure DATABASE_URL is Set**
In your **Vercel Dashboard** → **Settings** → **Environment Variables**, make sure you have:
```
DATABASE_URL=postgresql://your_postgres_connection_string
```

### **Step 2: Redeploy with Table Creation**
The latest code update includes `prisma db push` in the build command, which will:
1. ✅ Connect to your PostgreSQL database
2. ✅ Create all required tables automatically
3. ✅ Set up the schema

**Vercel will auto-deploy the latest commit, or click "Redeploy"**

### **Step 3: Verify Tables Created**
After successful deployment, these tables will exist:
- ✅ `users` (for authentication)
- ✅ `playlists` (user playlists)
- ✅ `playlist_tracks` (songs in playlists)  
- ✅ `liked_songs` (user favorites)
- ✅ `search_history` (search tracking)

---

## 🎯 **Alternative: Manual Database Setup**

If you want to verify your database connection first:

### **Using Vercel Postgres Dashboard:**
1. Go to **Vercel Dashboard** → **Storage**
2. Click your **Postgres database**
3. Open **"Query"** tab
4. Run this SQL to create tables manually:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create other tables (playlists, liked_songs, etc.)
-- The full schema will be created automatically by Prisma
```

### **Using Supabase Dashboard:**
1. Go to your **Supabase project**
2. **SQL Editor** → **New Query**
3. The tables will be created automatically by Prisma on deployment

---

## 🚀 **Expected Result**

After the redeploy with `prisma db push`:
- ✅ **No more table errors**
- ✅ **Login/Register working**
- ✅ **User accounts persist**
- ✅ **Full app functionality**

## 📝 **Current Status**

- ✅ **Code fixed and pushed**
- ✅ **Build command updated**
- ✅ **PostgreSQL schema ready**
- 📝 **Need**: Database connection + redeploy

**Your app will be fully functional once the tables are created!** 🎵