@echo off
REM Script pour initialiser et pousser le projet vers GitHub
REM Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub

echo 🚀 Initialisation du projet pour GitHub
echo ========================================
echo.

REM Vérifier si Git est installé
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git n'est pas installé. Veuillez installer Git d'abord.
    exit /b 1
)

echo ✅ Git détecté
echo.

REM Vérifier si le repo est déjà initialisé
if exist .git (
    echo ⚠️  Git est déjà initialisé dans ce dossier
    set /p continue="Continuer quand même ? (o/n): "
    if /i not "%continue%"=="o" (
        exit /b 1
    )
) else (
    echo 📦 Initialisation de Git...
    git init
    echo ✅ Git initialisé
    echo.
)

echo 📝 Configuration de Git...
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

echo 📂 Ajout des fichiers...
git add .

echo 📝 Premier commit...
git commit -m "Initial commit: Premium Subscription Platform"

echo.
echo ✅ Commit créé!
echo.
echo 🔗 Étapes suivantes:
echo 1. Allez sur https://github.com/new
echo 2. Créez un nouveau repository
echo 3. NOM: premium-subscription-platform
echo 4. N'INITIALISEZ PAS avec README, .gitignore ou LICENSE
echo 5. Cliquez 'Create repository'
echo.
echo 6. Puis exécutez les commandes ci-dessous:
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/premium-subscription-platform.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo ⚠️  Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub
echo.
