# Database Setup Instructions

## Initial Setup

1. **Create `.env.local` file** (if not already created):
```bash
# Copy the example file
copy .env.example .env.local
```

Or create it manually with:
```
DATABASE_URL="file:./prisma/dev.db"
YOUTUBE_API_KEY=your_youtube_api_key_here
JWT_SECRET=your-secret-key-change-in-production
```

2. Install dependencies:
```bash
npm install
```

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Create and run migrations:
```bash
npx prisma migrate dev --name init
```

This will:
- Create the SQLite database file (`prisma/dev.db`)
- Create all tables based on the schema
- Generate the Prisma Client

## Environment Variables

Make sure your `.env.local` file includes:
```
DATABASE_URL="file:./prisma/dev.db"
YOUTUBE_API_KEY=your_youtube_api_key_here
JWT_SECRET=your-secret-key-change-in-production
```

## Database Schema

The database includes:
- **User**: User accounts and authentication
- **Playlist**: User playlists
- **PlaylistTrack**: Tracks in playlists
- **LikedSong**: User's liked songs
- **SearchHistory**: Search queries for AI recommendations

## Useful Commands

- View database in Prisma Studio:
```bash
npx prisma studio
```

- Reset database (WARNING: Deletes all data):
```bash
npx prisma migrate reset
```

- Create a new migration:
```bash
npx prisma migrate dev --name migration_name
```

- Apply migrations in production:
```bash
npx prisma migrate deploy
```

