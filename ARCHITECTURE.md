# Viewly – Schéma rapide

## Structure Next.js
```
[Request] → middleware.ts → app/layout.tsx
                │
                ├─ Script Ads (adsense) + <Analytics/>
                └─ Providers:
                     ThemeProvider
                       └ LanguageProvider
                           └ AuthProvider
                               └ PlayerProvider
                                   └ Page (route)
                                       ├─ UI from app/components + components/
                                       ├─ Logic/helpers in lib/
                                       └─ DB via prisma client (server actions)
Routes (app/*):
- login / account / profile / subscriptions / admin / rooms / song / search / library / liked
- api/* routes (backend handlers)
Assets: public/*
```

## Flux utilisateur
```
User ─→ Login/Account (AuthProvider) ──┐
                                       ├→ Protected pages: profile, library, liked, rooms, song
                                       │
                                       └→ Session/claims → middleware (garde)

ThemeProvider → thème global
LanguageProvider → textes multilingues
PlayerProvider → contrôle audio (lecture, file d’attente)
Analytics (Vercel) → collecte des vues
Adsense script → affichage pubs (si NEXT_PUBLIC_ADSENSE_CLIENT)
```

## Couches principales
- app/layout.tsx : composition globale + scripts (Adsense, Analytics) + providers.
- app/* : pages et routes API (app router).
- components/, app/components/ : UI réutilisable.
- contexts/ : états globaux (auth, player, thème, langue).
- lib/ : helpers/clients (ex: DB, intégrations).
- prisma/ : schéma et client base de données.
- public/ : assets statiques.
