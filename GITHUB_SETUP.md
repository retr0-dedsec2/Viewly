# Guide pour pousser le code sur GitHub

## Étapes pour publier votre code sur GitHub

### 1. Créer un dépôt sur GitHub

1. Allez sur [GitHub.com](https://github.com)
2. Cliquez sur le bouton **"+"** en haut à droite
3. Sélectionnez **"New repository"**
4. Remplissez les informations :
   - **Repository name**: `Viewly` (ou le nom que vous voulez)
   - **Description**: "AI Music Assistant with YouTube integration"
   - **Visibility**: Public ou Private (selon votre choix)
   - **NE PAS** cocher "Initialize with README" (vous avez déjà un README)
5. Cliquez sur **"Create repository"**

### 2. Ajouter tous les fichiers au dépôt Git

```bash
# Ajouter tous les fichiers
git add .

# Vérifier les fichiers ajoutés
git status
```

### 3. Créer le premier commit

```bash
git commit -m "Initial commit: AI Music Assistant with YouTube integration"
```

### 4. Connecter le dépôt local à GitHub

Après avoir créé le dépôt sur GitHub, vous verrez des instructions. Utilisez ces commandes :

```bash
# Ajouter le remote (remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/YOUR_USERNAME/Viewly.git

# Ou si vous utilisez SSH:
# git remote add origin git@github.com:YOUR_USERNAME/Viewly.git

# Vérifier que le remote est bien configuré
git remote -v
```

### 5. Pousser le code sur GitHub

```bash
# Pousser le code sur la branche main
git push -u origin main
```

Si vous avez une erreur, essayez :
```bash
git push -u origin master
```

### 6. Vérifier sur GitHub

Allez sur votre dépôt GitHub et vérifiez que tous les fichiers sont bien présents.

## Commandes Git utiles

```bash
# Voir l'état des fichiers
git status

# Voir l'historique des commits
git log

# Ajouter des changements
git add .
git commit -m "Description des changements"
git push

# Créer une nouvelle branche
git checkout -b feature/nom-de-la-fonctionnalite

# Changer de branche
git checkout main
```

## Fichiers à ne PAS pousser (déjà dans .gitignore)

- `.env` et `.env.local` (contiennent vos clés API)
- `node_modules/` (dépendances)
- `.next/` (build Next.js)
- `prisma/*.db` (base de données locale)
- Fichiers de configuration locaux

## Note importante

⚠️ **NE JAMAIS** pousser vos fichiers `.env` ou `.env.local` sur GitHub car ils contiennent vos clés API secrètes !

