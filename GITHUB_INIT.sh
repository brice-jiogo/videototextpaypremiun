#!/bin/bash
# Script pour initialiser et pousser le projet vers GitHub
# Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub

echo "🚀 Initialisation du projet pour GitHub"
echo "========================================"
echo ""

# Vérifier si Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé. Veuillez installer Git d'abord."
    exit 1
fi

echo "✅ Git détecté"
echo ""

# Vérifier si le repo est déjà initialisé
if [ -d .git ]; then
    echo "⚠️  Git est déjà initialisé dans ce dossier"
    read -p "Continuer quand même ? (o/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        exit 1
    fi
else
    echo "📦 Initialisation de Git..."
    git init
    echo "✅ Git initialisé"
    echo ""
fi

echo "📝 Configuration de Git..."
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

echo "📂 Ajout des fichiers..."
git add .

echo "📝 Premier commit..."
git commit -m "Initial commit: Premium Subscription Platform

- Production-ready React + TypeScript application
- Stripe integration with flexible pricing
- Firebase authentication and Firestore database
- Email receipt system with SMTP
- Responsive UI with Tailwind CSS
- Optimized build (43.9 KB server bundle)
- Complete documentation and guides"

echo ""
echo "✅ Commit créé!"
echo ""
echo "🔗 Étapes suivantes:"
echo "1. Allez sur https://github.com/new"
echo "2. Créez un nouveau repository"
echo "3. NOM: premium-subscription-platform"
echo "4. N'INITIALISEZ PAS avec README, .gitignore ou LICENSE"
echo "5. Cliquez 'Create repository'"
echo ""
echo "6. Puis exécutez les commandes ci-dessous:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/premium-subscription-platform.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "⚠️  Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub"
echo ""
