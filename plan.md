# Plan: Système d'authentification et de paiement premium fonctionnel

## TL;DR
Implémenter un système complet d'authentification (Sign In/Sign Up), de gestion des abonnements premium avec trois tiers tarifaires en USD ($9,99/mois, $69,99/an, $129,99 à vie), vérification du statut premium avec dates d'expiration, essai gratuit de 7 jours, et reçus par email. Le système utilisera Stripe pour les paiements et Firestore pour la gestion des données utilisateur.

## Architecture globale
- **Frontend**: React avec React Router pour la navigation, pages d'authentification, pricing, dashboard
- **Backend**: Express.js avec webhooks Stripe, gestion des abonnements, envoi d'emails
- **Base de données**: Firestore pour les données utilisateur et les status d'abonnement
- **Paiements**: Stripe (déjà configuré)
- **Emails**: Firebase Firestore + Cloud Functions (ou nodemailer si pas de CF disponibles)

## Phases d'implémentation

### Phase 1: Mise à jour des tarifs et configuration
**Dépendances**: Aucune  
**Durée estimée**: 30 minutes  

1. Mettre à jour [Pricing.tsx](src/pages/Pricing.tsx) avec les tarifs USD:
   - Monthly: $9.99
   - Yearly: $69.99  
   - Lifetime: $129.99

2. Modifier le schéma utilisateur Firestore pour inclure:
   - `premiumStatus`: 'FREE' | 'PREMIUM_TRIAL' | 'PREMIUM'
   - `premiumStartDate`: timestamp (date de début du premium/essai)
   - `premiumEndDate`: timestamp (date d'expiration, null pour lifetime)
   - `subscriptionType`: 'MONTHLY' | 'YEARLY' | 'LIFETIME' | null
   - `stripeCustomerId`: string
   - `stripeSubscriptionId`: string
   - `lastReceiptUrl`: string (URL du dernier reçu)

3. Mettre à jour [server.ts](server.ts) - endpoint `/api/create-checkout-session`:
   - Changer devise de 'eur' à 'usd'
   - Mettre à jour unit_amount: 999, 6999, 12999 (cents)
   - S'assurer que subscription_data ajoute trial_period_days: 7 pour Monthly et Yearly

4. Créer/mettre à jour la fonction `syncUserDocument` dans [firebase.ts](src/lib/firebase.ts) pour initialiser le schéma utilisateur avec les champs premium

### Phase 2: Vérification du statut premium et expiration
**Dépendances**: Phase 1  
**Durée estimée**: 1 heure  

1. Créer une fonction utilitaire `checkPremiumStatus()` dans [utils.ts](src/lib/utils.ts):
   - Vérifie si premiumEndDate est dépassé
   - Si dépassé ET l'abonnement est actif dans Stripe, prolonger
   - Si premiumEndDate dépassé ET pas d'abonnement actif, passer à FREE
   - Retourne le statut correct

2. Améliorer [AuthContext.tsx](src/context/AuthContext.tsx):
   - Appeler `checkPremiumStatus()` lors du chargement utilisateur
   - Ajouter à userData: `isPremiumActive` (booléen)
   - Ajouter à userData: `premiumExpiresAt` (timestamp)
   - Ajouter à userData: `daysRemainingInTrial` (nombre)

3. Mettre à jour le webhook Stripe dans [server.ts](server.ts):
   - `checkout.session.completed`: Ajouter premiumStartDate et premiumEndDate basé sur le type d'abonnement
   - Ajouter la gestion de `customer.subscription.updated` pour mettre à jour les dates d'expiration
   - Ajouter la gestion de `charge.refunded` pour réinitialiser le statut

### Phase 3: Améliorations de l'authentification
**Dépendances**: Phase 1  
**Durée estimée**: 1 heure  

1. Améliorer [Login.tsx](src/pages/Login.tsx):
   - Ajouter validation des emails (format correct)
   - Ajouter validation des passwords (min 8 caractères, lettres majuscules/minuscules, chiffres)
   - Améliorer les messages d'erreur d'authentification
   - Ajouter "mot de passe oublié" (lien vers Firebase password reset)
   - Améliorer l'UX avec spinners et désactivation des boutons
   - Ajouter confirmation de l'adresse email après Sign Up

2. Créer une page [ForgotPassword.tsx](src/pages/ForgotPassword.tsx):
   - Lien depuis [Login.tsx](src/pages/Login.tsx)
   - Envoyer email de réinitialisation via Firebase
   - Message de confirmation

3. Mettre à jour [AuthContext.tsx](src/context/AuthContext.tsx):
   - Ajouter gestion des erreurs d'authentification plus granulaires
   - Gérer le cas utilisateur non vérifié

### Phase 4: Système d'envoi de reçus par email
**Dépendances**: Phase 2, Phase 3  
**Durée estimée**: 1.5 heures  

1. Installer nodemailer ou utiliser Firebase Cloud Functions:
   ```
   npm install nodemailer  (si pas de CF)
   ```

2. Créer endpoint `/api/send-receipt` dans [server.ts](server.ts):
   - Reçoit: `customerId`, `amount`, `invoiceUrl`
   - Récupère l'email de l'utilisateur depuis Firestore
   - Envoie un email avec les détails de la facture
   - Stocke l'URL du reçu dans Firestore (`lastReceiptUrl`)

3. Mettre à jour le webhook Stripe pour appeler `/api/send-receipt` lors des événements:
   - `checkout.session.completed`
   - `invoice.paid`
   - `charge.succeeded`

4. Créer un template d'email HTML pour les reçus:
   - Logo/branding du site
   - Détails du paiement (montant, devise, date)
   - Type d'abonnement et période de validité
   - Lien pour gérer l'abonnement

### Phase 5: Amélioration du Dashboard et des pages
**Dépendances**: Phases 1-4  
**Durée estimée**: 1.5 heures  

1. Améliorer [Dashboard.tsx](src/pages/Dashboard.tsx):
   - Afficher le statut premium avec badge visuel
   - Afficher les dates d'expiration premium avec format lisible
   - Afficher le nombre de jours restants pour les abonnements
   - Bouton "Gérer l'abonnement" (Stripe Portal)
   - Bouton "Voir mon dernier reçu" (vers PDF dans Stripe)
   - Bouton "Se déconnecter" avec confirmation
   - Zone dédiée pour les utilisateurs FREE avec CTA vers pricing
   - Afficher l'historique des paiements (derniers 3)

2. Améliorer [Pricing.tsx](src/pages/Pricing.tsx):
   - Afficher un message si utilisateur déjà premium
   - Afficher le statut du compte (jours restants, date d'expiration)
   - Améliorer le design: clarté, comparaison des plans, badge "Populaire" sur yearly
   - Boutons d'action différenciés si déjà premium

3. Créer une page [Landing.tsx](src/pages/Landing.tsx) améiorée:
   - CTA clair vers pricing pour non-authentifiés
   - Affichage des features premium
   - Testimonials ou statistiques
   - Lien vers Sign Up

4. Améliorer [Navigation.tsx](src/components/Navigation.tsx):
   - Afficher le statut utilisateur (FREE/PREMIUM avec durée)
   - Menu utilisateur dropdown avec options (Profile, Settings, Logout)
   - Afficher un badge si essai gratuit actif

### Phase 6: Logiques additionnelles et finitions
**Dépendances**: Phases 1-5  
**Durée estimée**: 1 heure  

1. Créer une route protégée `ProtectedRoute` component:
   - Rediriger non-authentifiés vers /login
   - Rediriger FREE vers /pricing pour accès premium
   - Appliquer aux pages nécessitant premium

2. Ajouter gestion complète des erreurs:
   - Toast notifications pour les succès/erreurs
   - Gestion gracieuse des erreurs Stripe
   - Logs côté backend détaillés

3. Améliorer la vérification du statut premium:
   - Vérifier aussi lors du chargement initial du dashboard
   - Ajouter un refresh manuel du statut
   - Afficher un spinner durant la vérification

4. Tests manuels:
   - Sign up → reçoit essai gratuit 7j
   - Accès premium immédiatement
   - Paiement après 7j via Stripe
   - Reçu envoyé par email
   - Gestion d'abonnement fonctionnelle
   - Expiration du trial → passe à FREE si pas de paiement

## Fichiers à créer/modifier

**Créer**:
- `src/pages/ForgotPassword.tsx` — Réinitialisation mot de passe
- `src/components/ProtectedRoute.tsx` — Composant pour routes protégées
- `src/components/Toast.tsx` — Notifications toast
- `src/lib/emailTemplates.ts` — Templates HTML pour emails
- `.env.example` — Variables d'environnement pour Email

**Modifier**:
- `src/pages/Pricing.tsx` — Tarifs USD, messages améliorés
- `src/pages/Dashboard.tsx` — Affichage statut premium, gestion abonnement
- `src/pages/Login.tsx` — Validation, UX améliorée
- `src/pages/Landing.tsx` — Amélioration globale
- `src/components/Navigation.tsx` — Menu utilisateur, status badge
- `src/context/AuthContext.tsx` — Vérification premium, données enrichies
- `src/lib/firebase.ts` — Schema utilisateur, fonctions utilitaires
- `src/lib/utils.ts` — Fonctions de vérification du statut premium
- `server.ts` — Endpoints de paiement, webhooks Stripe, email
- `package.json` — Ajouter dépendances (nodemailer si nécessaire)

## Variables d'environnement requises

```
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_PROVIDER=smtp (ou firebase-functions)
SMTP_HOST=smtp.gmail.com (ou autre)
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-password-app
ADMIN_EMAIL=notifications@votreapp.com

# App
APP_URL=http://localhost:3000 (production)
```

## Vérification et validation

1. **Authentification**:
   - [ ] Sign up crée un utilisateur avec statut FREE
   - [ ] Sign in fonctionne
   - [ ] Mot de passe oublié fonctionne
   - [ ] Email confirmation si demandé

2. **Premium et paiements**:
   - [ ] Sélectionner plan crée session Stripe
   - [ ] Paiement recrée utilisateur PREMIUM_TRIAL avec dates correctes
   - [ ] Accès immédiat aux features premium après paiement
   - [ ] Reçu envoyé par email
   - [ ] Après 7j, le premier paiement de l'abonnement est prélevé
   - [ ] Date d'expiration correctement gérée

3. **Dashboard**:
   - [ ] Affiche statut premium avec durée restante
   - [ ] Bouton "Gérer" ouvre Stripe Portal
   - [ ] Historique des paiements visible
   - [ ] Badge FREE si pas premium

4. **Pages publiques**:
   - [ ] Landing page est attrayante
   - [ ] Pricing page montre les 3 plans en USD
   - [ ] Navigation affiche le statut utilisateur

## Décisions et assomptions

- **Paiement**: Essai gratuit 7j pour Monthly/Yearly, paiement immédiat pour Lifetime (déjà en place)
- **Vérification premium**: Combinaison Firestore + Stripe pour fiabilité
- **Reçus**: Email personnalisé depuis le serveur (plus flexible que Stripe par défaut)
- **Devise**: USD uniquement (pas de conversion)
- **Authentification**: Email/Password + Google Auth déjà en place, amélioration de l'UX
- **Statut**: Trois états possibles (FREE, PREMIUM_TRIAL, PREMIUM) pour clarté

## Considérations supplémentaires

1. **Sécurité**: Les clés Stripe doivent être en variables d'environnement et jamais commitées
2. **Rate limiting**: Ajouter rate limiting sur les endpoints sensibles (checkout, webhooks)
3. **Monitoring**: Implémenter des logs détaillés pour déboguer les paiements
4. **Localisation**: Actuellement en anglais/français, adapter au besoin
