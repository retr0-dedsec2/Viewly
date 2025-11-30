# Viewly

A beautiful, responsive web application for listening to music with an AI assistant, inspired by Spotify and Apple Music design.

## Features

- 🎵 Modern music player with Spotify/Apple Music inspired UI
- 🔐 User authentication system with database (Prisma + SQLite)
- 🎬 YouTube API integration for real music playback
- 🔍 Advanced search with filters and sorting
- 📚 Personal library and playlist management
- 👤 User profile page
- 🤖 AI Assistant chat interface with YouTube integration
- 🎨 Beautiful, fully responsive design (mobile, tablet, desktop)
- 🔊 Volume control and playback controls
- ⏭️ Next/Previous track navigation
- 📄 Multiple pages (Home, Search, Library, Profile, Liked Songs)
- 🧠 AI-powered music recommendations based on user preferences
- 💾 Persistent data storage with SQLite database

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. Create a `.env.local` file in the root directory:
```
DATABASE_URL="file:./dev.db"
YOUTUBE_API_KEY=your_youtube_api_key_here
JWT_SECRET=your-secret-key-change-in-production
# Optional: Google AdSense for free users
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT=1234567890
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Two-factor authentication & email codes
- Configure SMTP credentials in `.env.local` to send verification emails:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM="Viewly <noreply@example.com>"
```
- Users can enable/disable 2FA from the Profile page. When enabled, a 6-digit code is emailed after password entry.

## Database Setup

The application uses Prisma with SQLite for data persistence. The database stores:
- User accounts and authentication
- Playlists and tracks
- Liked songs
- Search history (for AI recommendations)

To reset the database:
```bash
npx prisma migrate reset
```

## YouTube API Integration

The app uses YouTube Data API v3 for searching and playing music. To enable full functionality:

1. Get a YouTube Data API key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable "YouTube Data API v3"
   - Create credentials (API Key)
   - Copy your API key

2. Add to `.env.local`:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
```

3. The app will work without the API key (using mock data), but for real YouTube music playback, the API key is required.

**Note:** YouTube Data API has a free quota of 10,000 units per day. Each search request costs 100 units.

## AI Assistant Integration

The AI assistant provides:
- Personalized music recommendations based on your liked songs
- Intelligent search suggestions
- Context-aware responses using your search history
- YouTube integration for finding and playing music

The AI analyzes your preferences and provides smart recommendations without requiring external AI APIs.

## Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1280px+)

Features:
- Collapsible sidebar on mobile
- Touch-friendly controls
- Optimized layouts for all screen sizes
- Smooth animations and transitions

## Project Structure

```
├── app/
│   ├── login/          # Login/Register page
│   ├── search/         # Advanced search page
│   ├── library/        # User library and playlists
│   ├── profile/        # User profile page
│   ├── liked/          # Liked songs page
│   └── api/
│       ├── auth/       # Authentication endpoints
│       ├── youtube/    # YouTube API endpoints
│       ├── ai/         # AI recommendations
│       └── chat/       # AI chat API
├── components/
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── MusicPlayer.tsx # Music player controls
│   ├── MainContent.tsx # Main content area
│   ├── AIChat.tsx      # AI assistant chat
│   ├── SearchBar.tsx   # YouTube search bar
│   ├── LikeButton.tsx  # Like button component
│   └── YoutubePlayer.tsx # YouTube IFrame player
├── contexts/
│   └── AuthContext.tsx # Authentication context
├── lib/
│   ├── prisma.ts       # Prisma client
│   ├── auth.ts         # Server-side auth utilities
│   ├── auth-client.ts  # Client-side auth utilities
│   ├── liked-songs.ts  # Liked songs utilities
│   └── youtube.ts      # YouTube utility functions
├── prisma/
│   └── schema.prisma   # Database schema
├── types/
│   ├── music.ts        # Music types
│   └── user.ts         # User types
└── package.json
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **SQLite** - Database
- **Tailwind CSS** - Styling with responsive utilities
- **Lucide React** - Icons
- **Framer Motion** - Animations
- **YouTube Data API v3** - Music search and metadata
- **YouTube IFrame Player API** - Music playback
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## License

MIT
