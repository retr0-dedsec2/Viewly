# 🚀 Guide de Déploiement Gratuit - Viewly

## ⭐ Option 1 : Vercel (RECOMMANDÉ - 100% Gratuit)

**Pourquoi Vercel ?**
- ✅ Créé par l'équipe Next.js
- ✅ 100% gratuit pour toujours
- ✅ Déploiement automatique depuis GitHub
- ✅ SSL/HTTPS gratuit
- ✅ CDN global
- ✅ Pas de limite de temps

**Limites gratuites :**
- 100 GB de bande passante/mois
- Fonctions serverless illimitées
- Builds illimités

### Déploiement sur Vercel :

1. **Créer un compte :**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Sign Up" → Connectez avec GitHub

2. **Importer le projet :**
   - Cliquez sur "Add New" → "Project"
   - Sélectionnez votre dépôt `Viewly`
   - Vercel détecte automatiquement Next.js

3. **Configurer les variables d'environnement :**
   ```
   DATABASE_URL=votre_url_database
   YOUTUBE_API_KEY=votre_cle_youtube
   JWT_SECRET=votre_secret_jwt
   ```

4. **Déployer :**
   - Cliquez sur "Deploy"
   - Votre app sera en ligne en 2-3 minutes !

**URL :** `https://viewly.vercel.app` (ou votre nom personnalisé)

---

## ⭐ Option 2 : Railway (Excellent pour base de données)

**Avantages :**
- ✅ $5 de crédit gratuit/mois (suffisant pour une petite app)
- ✅ PostgreSQL gratuit inclus
- ✅ Déploiement automatique
- ✅ SSL gratuit

**Limites :**
- $5 de crédit/mois (environ 500 heures)

### Déploiement sur Railway :

1. Allez sur [railway.app](https://railway.app)
2. Connectez GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Sélectionnez votre dépôt
5. Ajoutez une base de données PostgreSQL
6. Configurez les variables d'environnement

---

## ⭐ Option 3 : Render (Gratuit avec limitations)

**Avantages :**
- ✅ Plan gratuit disponible
- ✅ PostgreSQL gratuit (90 jours)
- ✅ SSL automatique

**Limites :**
- App "s'endort" après 15 min d'inactivité
- PostgreSQL gratuit seulement 90 jours

### Déploiement sur Render :

1. Allez sur [render.com](https://render.com)
2. Créez un compte
3. "New" → "Web Service"
4. Connectez GitHub
5. Configurez les variables d'environnement

---

## 🗄️ Base de Données Gratuite

### Option A : Supabase (PostgreSQL - RECOMMANDÉ)

**Avantages :**
- ✅ 500 MB PostgreSQL gratuit
- ✅ 2 GB bande passante/mois
- ✅ 50,000 utilisateurs/mois
- ✅ API REST automatique
- ✅ Authentification incluse

**Créer un compte :**
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez la connection string PostgreSQL
4. Utilisez-la dans `DATABASE_URL`

### Option B : Vercel Postgres

**Avantages :**
- ✅ Intégré avec Vercel
- ✅ 256 MB gratuit
- ✅ Facile à configurer

**Configuration :**
1. Dans votre projet Vercel
2. Onglet "Storage" → "Create Database"
3. Sélectionnez "Postgres"
4. La `DATABASE_URL` est automatiquement ajoutée

### Option C : PlanetScale (MySQL)

**Avantages :**
- ✅ MySQL serverless gratuit
- ✅ 5 GB de stockage
- ✅ 1 milliard de requêtes/mois

---

## 📝 Configuration pour Production

### 1. Mettre à jour Prisma pour PostgreSQL

Si vous utilisez Supabase ou Vercel Postgres, modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Changez de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

Puis exécutez :
```bash
npx prisma migrate deploy
```

### 2. Variables d'environnement sur Vercel

Dans les paramètres du projet Vercel → "Environment Variables", ajoutez :

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
YOUTUBE_API_KEY=votre_cle_youtube
JWT_SECRET=un_secret_long_et_aleatoire
```

### 3. Déploiement Automatique

Une fois configuré, chaque `git push` déclenchera automatiquement un nouveau déploiement !

---

## 🎯 Recommandation Finale

**Pour votre app Viewly, je recommande :**

1. **Hébergement :** Vercel (100% gratuit, optimisé Next.js)
2. **Base de données :** Supabase PostgreSQL (500 MB gratuit)

**Pourquoi cette combinaison ?**
- ✅ 100% gratuit
- ✅ Pas de limites strictes
- ✅ Facile à configurer
- ✅ Performant et fiable
- ✅ SSL/HTTPS automatique

---

## 🚀 Déploiement Rapide (5 minutes)

### Étape 1 : Préparer le code
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Étape 2 : Créer Supabase (base de données)
1. [supabase.com](https://supabase.com) → Créer un compte
2. "New Project" → Notez la connection string

### Étape 3 : Déployer sur Vercel
1. [vercel.com](https://vercel.com) → Connecter GitHub
2. Importer le dépôt `Viewly`
3. Ajouter les variables d'environnement
4. Cliquer "Deploy"

### Étape 4 : Migrer la base de données
```bash
# Mettre à jour schema.prisma pour PostgreSQL
# Puis sur Vercel, dans les logs du build, exécutez :
npx prisma migrate deploy
```

---

## 📊 Comparaison des Hébergeurs Gratuits

| Hébergeur | Gratuit | Base de données | Facile | Recommandé |
|-----------|---------|-----------------|--------|------------|
| **Vercel** | ✅ Oui | Via Supabase | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Railway** | ✅ $5 crédit | ✅ Incluse | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Render** | ⚠️ Limité | ⚠️ 90 jours | ⭐⭐⭐ | ⭐⭐⭐ |
| **Netlify** | ✅ Oui | External | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## ⚠️ Important

- Ne poussez JAMAIS vos fichiers `.env` sur GitHub
- Utilisez les variables d'environnement de la plateforme
- Changez `JWT_SECRET` pour un secret aléatoire en production
- Testez votre app après le déploiement

---

## 🎉 Résultat

Votre app sera accessible sur :
- **Vercel :** `https://viewly.vercel.app`
- **Railway :** `https://viewly.up.railway.app`
- **Render :** `https://viewly.onrender.com`

**Tout est 100% gratuit !** 🎊
