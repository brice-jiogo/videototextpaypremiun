# 🧪 GUIDE DE TEST - MANAGE BILLING, STOP PAYMENTS & PAYMENT HISTORY

## 📋 Scenarios de Test

### **Test 1: Vérifier le Payment History**
```
1. Connectez-vous avec un compte premium
2. Allez sur le Dashboard
3. Attendez que "Payment History" se charge
4. Vérifiez que vous voyez tous les paiements:
   ✓ Montants
   ✓ Dates
   ✓ Types (invoice, charge)
   ✓ Liens de reçus cliquables

Résultat Attendu:
- Pas d'erreur "Could not load credentials"
- Historique affiche au minimum 1 paiement
- Les reçus s'ouvrent dans Stripe
```

---

### **Test 2: Vérifier l'Affichage du Renouvellement Automatique**
```
1. Dashboard → Section "Premium Status"
2. Regarder la carte verte "Auto-Renewal Enabled"
3. Vérifiez ces informations:
   ✓ "Auto-Renewal Enabled" ou "Auto-Renewal Disabled"
   ✓ "Renews on [DATE]"
   ✓ "in [X] days"
   ✓ Période actuelle et date de renouvellement

Résultat Attendu:
- Pour Monthly: "Renews on [Date] (in ~30 days)"
- Pour Yearly: "Renews on [Date] (in ~365 days)"
- Pour Lifetime: Pas de renouvellement (pas de bouton Stop)
- Dates exactes correspondent à Stripe
```

---

### **Test 3: Tester "Manage Billing" Button**
```
1. Dashboard → Section "Premium Status"
2. Cliquez sur "Manage Billing"
3. Vérifiez:
   ✓ Le Billing Portal de Stripe s'ouvre
   ✓ Pas d'erreur "No Stripe customer found"
   ✓ Vous pouvez voir la subscription
   ✓ Vous pouvez modifier la carte

Résultat Attendu:
- Stripe Portal s'ouvre en 1-2 secondes
- Aucune erreur d'authentification
- Portal affiche la subscription active
```

---

### **Test 4: Tester "Stop Auto-Renewal" Button**
```
AVANT:
1. Vérifiez que vous êtes Premium avec auto-renewal ACTIF
2. Le bouton "Stop Auto-Renewal" est visible

ACTION:
3. Cliquez sur "Stop Auto-Renewal"
4. Confirmer si demandé

APRÈS:
5. Vérifiez:
   ✓ Message toast: "Auto-renewal stopped"
   ✓ Le bouton disparaît
   ✓ Status change à "Premium Active - Renewal Stopped"
   ✓ Le compte reste actif jusqu'à la fin de la période
   ✓ Prochaine date n'est plus renouvelée

Résultat Attendu:
- Pas d'erreur "No active subscription"
- Status UI mise à jour immédiatement
- Dans Stripe Portal: cancel_at_period_end = true
```

---

### **Test 5: Vérifier le Cycle de Facturation Automatique**
```
SIMUL: Attendre fin de mois/année (ou créer une subscription avec trial court)

1. Quand la date de renouvellement arrive:
   ✓ Stripe facture automatiquement
   ✓ Webhook `invoice.paid` déclenché
   ✓ Payment History se met à jour
   ✓ Dashboard affiche le nouveau paiement
   ✓ Prochaine date est mise à jour

Résultat Attendu:
- Aucune interaction utilisateur requise
- Prélèvement automatique le jour annoncé
- Historique mis à jour dans 1-2 secondes
- Montant exact prélevé
```

---

### **Test 6: Vérifier l'Email de Reçu (Si SMTP configuré)**
```
0. Configuration optionnelle dans .env:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password

1. Après un paiement:
   ✓ Vérifiez que un email est reçu
   ✓ Email contient le montant
   ✓ Email a lien vers reçu Stripe
   ✓ Format HTML professionnel

Résultat Attendu:
- Email reçu dans 5-10 secondes après paiement
- Contient détails complets
- Lien reçu fonctionne
```

---

### **Test 7: Vérifier les Fallbacks (Sans Firebase Admin)**
```
Cette configuration est déjà active!

1. Vérifiez que sans Firebase Admin credentials:
   ✓ Les endpoints marchent quand même
   ✓ Les recherches Stripe fonctionnent
   ✓ Tous les boutons restent fonctionnels
   ✓ Pas de "Could not load credentials" error visible

Résultat Attendu:
- Système reste fonctionnel
- Peut prendre 1-2 sec de plus (recherche email)
- Aucun message d'erreur utilisateur
- Stripe est source de vérité
```

---

## 🎯 Checklist de Validation

| Fonctionnalité | Avant | Après | Status |
|---|---|---|---|
| Payment History | ❌ Vide | ✅ Complet | ✓ |
| Manage Billing | ❌ Erreur | ✅ Fonctionne | ✓ |
| Stop Auto-Renewal | ❌ Erreur | ✅ Fonctionne | ✓ |
| Affichage Renouvellement | ❌ Absent | ✅ Visible | ✓ |
| Sans Admin Credentials | ❌ Crash | ✅ Fallback | ✓ |
| Prélèvements Automatiques | ✅ Stripe | ✅ Affichés | ✓ |

---

## 🔍 Debugging Si Problème

### Erreur: "No Stripe customer found"
```
Causes possibles:
1. Customer n'existe pas dans Stripe
2. Email ne correspond pas

Solution:
1. Vérifiez stripe.com dashboard
2. Recherchez par email
3. Cliquez "Refresh Status" dans Dashboard
```

### Erreur: "No active subscription"
```
Causes possibles:
1. Subscription annulée dans Stripe
2. Trial expiré sans renouvellement

Solution:
1. Vérifiez Stripe Portal
2. Vérifiez les webhooks dans Stripe dashboard
3. Cliquez "Sync Latest Checkout Session"
```

### Payment History Toujours Vide
```
Causes possibles:
1. Aucun paiement effectué
2. Recherche Stripe timée

Solution:
1. Complétez un paiement test
2. Cliquez "Refresh Status"
3. Attendez 2-5 secondes
4. Vérifiez console navigateur (F12)
```

---

## 📊 Endpoints à Tester en Curl

```bash
# Test Payment History
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
  https://your-app.com/api/billing-history

# Test Subscription Details
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
  https://your-app.com/api/subscription-details

# Test Create Portal Session
curl -X POST \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  https://your-app.com/api/create-portal-session

# Test Cancel Subscription
curl -X POST \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  https://your-app.com/api/cancel-subscription
```

---

## ✅ Validation Finale

Une fois tous les tests réussis:

```
✓ Utilisateurs peuvent voir leur historique de paiement
✓ Utilisateurs savent quand le prochain prélèvement aura lieu
✓ Utilisateurs peuvent arrêter le renouvellement facilement
✓ Prélèvements automatiques chaque fin de mois/année
✓ Emails de reçus envoyés (si SMTP configuré)
✓ Aucune erreur "Could not load credentials"
✓ Système résilient même sans Firebase Admin
✓ Tous les boutons fonctionnent
✓ UI est claire et professionnelle
```

**→ LE SITE EST PRODUCTION-READY ✅**
