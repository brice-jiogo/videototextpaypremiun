# 🧠 MASTER PROMPT ENGINEERING — Cerveau Directeur
> **Version** 2.0 · **Modèle cible** Claude Sonnet 4.6 / Opus 4.6  
> **Objectif** : Extraire le meilleur résultat possible de chaque génération de code ou de contenu, en s'assurant que l'IA comprend l'intention profonde — pas seulement les mots.

---

## ⚡ PRINCIPE FONDAMENTAL

> *"Le meilleur prompt n'est pas le plus long ni le plus complexe — c'est celui qui communique l'INTENTION RÉELLE avec une précision chirurgicale."*

L'IA ne lit pas dans les pensées. Elle interprète les mots. Ce fichier est le pont entre ta pensée et la sortie parfaite.

---

## 🏗️ ARCHITECTURE D'UN PROMPT PARFAIT

Tout prompt puissant est construit sur **5 piliers** :

```
[RÔLE] → [CONTEXTE] → [TÂCHE] → [CONTRAINTES] → [FORMAT DE SORTIE]
```

### Pilier 1 — RÔLE (Qui est l'IA ?)
Définis une identité experte avant toute demande. L'IA performe mieux quand elle incarne un personnage.

```
✅ BON : "Tu es un architecte senior fullstack avec 15 ans d'expérience en React/Node.js 
         spécialisé dans les applications SaaS haute performance."

❌ MAUVAIS : "Tu es un développeur."
```

### Pilier 2 — CONTEXTE (Quel est l'univers du problème ?)
Donne les informations que l'IA ne peut PAS deviner. Ne suppose pas qu'elle sait.

```
✅ BON : "Je construis une app mobile de livraison pour le marché camerounais. 
         Stack : React Native + Supabase. Les utilisateurs ont souvent une connexion lente (2G/3G).
         Budget UI limité, doit fonctionner hors-ligne en partie."

❌ MAUVAIS : "J'ai une app de livraison."
```

### Pilier 3 — TÂCHE (Quoi exactement ?)
Formule la demande en action concrète. Utilise des verbes d'action.

```
✅ BON : "Crée le composant React Native de l'écran d'accueil avec : 
         liste des commandes actives, barre de recherche, filtre par statut,
         pull-to-refresh, et skeleton loader pendant le chargement."

❌ MAUVAIS : "Fais l'écran d'accueil."
```

### Pilier 4 — CONTRAINTES (Les garde-fous)
Dis ce que tu NE veux PAS autant que ce que tu veux.

```
✅ BON : "N'utilise pas de bibliothèques tierces sauf celles déjà installées.
         Pas de classe CSS inline. Le code doit être TypeScript strict.
         Maximum 200 lignes par fichier."

❌ MAUVAIS : (rien — l'IA fera ses propres choix)
```

### Pilier 5 — FORMAT DE SORTIE (Comment livrer ?)
Spécifie exactement comment tu veux recevoir le résultat.

```
✅ BON : "Livre dans cet ordre :
         1. Explication de l'architecture (3-5 lignes)
         2. Code complet avec commentaires
         3. Liste des dépendances à installer
         4. 2-3 points d'amélioration future possibles"

❌ MAUVAIS : (aucune instruction — tu obtiens ce que l'IA décide)
```

---

## 🎯 TEMPLATES DE PROMPTS PAR CATÉGORIE

### 🖥️ TEMPLATE — Génération de Code

```
RÔLE: Tu es [EXPERT SPÉCIFIQUE] spécialisé en [TECHNOLOGIE].

CONTEXTE:
- Projet : [DESCRIPTION COURTE]
- Stack technique : [LISTE DES TECHNOLOGIES]
- Contraintes d'environnement : [ex: mobile, low-bandwidth, offline-first]
- Public cible : [QUI UTILISE CE CODE]
- État actuel : [CE QUI EXISTE DÉJÀ]

TÂCHE:
Crée [COMPOSANT/FONCTION/MODULE] qui :
- [FONCTIONNALITÉ 1]
- [FONCTIONNALITÉ 2]
- [FONCTIONNALITÉ 3]

CONTRAINTES TECHNIQUES:
- [Ce qu'il NE faut PAS faire]
- [Bibliothèques autorisées / interdites]
- [Standards de code à respecter]
- [Limites de performance]

QUALITÉ ATTENDUE:
- Code production-ready (pas un prototype)
- Gestion des erreurs complète
- TypeScript strict (si applicable)
- Commentaires sur la logique complexe

LIVRAISON:
1. Résumé de l'approche choisie (3-5 lignes)
2. Code complet et fonctionnel
3. Instructions d'intégration
4. Tests unitaires de base (si demandé)
```

---

### 🎨 TEMPLATE — Génération d'UI/Design

```
RÔLE: Tu es un designer UI/UX expert en [PLATFORM: web/mobile/desktop] 
      avec une maîtrise de [FRAMEWORK: Tailwind/Material/shadcn].

CONTEXTE:
- Application : [DESCRIPTION]
- Utilisateurs : [PROFIL, ÂGE, NIVEAU TECH]
- Ambiance visuelle : [MODERNE/MINIMALISTE/COLORÉE/CORPORATE]
- Référence de style : [APPS SIMILAIRES QUE TU AIMES]
- Couleurs de marque : [HEX ou description]

TÂCHE:
Conçois [ÉCRAN/COMPOSANT/PAGE] avec :
- [ÉLÉMENT 1 et son comportement]
- [ÉLÉMENT 2 et son comportement]
- États : vide / chargement / erreur / succès

CONTRAINTES:
- Responsive : [mobile-first / desktop-first]
- Accessibilité : [WCAG AA si web]
- Pas d'images externes (utilise placeholders ou SVG)

LIVRAISON: Code HTML/JSX complet avec styles intégrés.
```

---

### 🏛️ TEMPLATE — Architecture & Conception Système

```
RÔLE: Tu es un architecte logiciel senior expert en systèmes [TYPE: distribués/temps-réel/SaaS].

CONTEXTE:
- Problème métier : [CE QUE LE SYSTÈME DOIT RÉSOUDRE]
- Échelle prévue : [NOMBRE D'UTILISATEURS, VOLUME DE DONNÉES]
- Budget technique : [CONTRAINTES DE COÛT/INFRASTRUCTURE]
- Équipe : [TAILLE, NIVEAUX]

TÂCHE:
Conçois l'architecture de [SYSTÈME] incluant :
- Structure des dossiers / modules
- Flux de données entre composants
- Schéma de base de données
- Points d'API critiques
- Stratégie de gestion des erreurs

FORMAT: 
- Diagramme textuel (ASCII ou Mermaid)
- Explication de chaque choix architectural
- Alternatives considérées et pourquoi rejetées
- Risques et mitigation
```

---

### 🐛 TEMPLATE — Debug & Résolution de Problèmes

```
RÔLE: Tu es un expert en débogage [TECHNOLOGIE] avec une approche méthodique.

CONTEXTE:
- Code concerné : [COLLER LE CODE]
- Message d'erreur exact : [COLLER L'ERREUR]
- Comportement attendu : [CE QUI DEVRAIT SE PASSER]
- Comportement observé : [CE QUI SE PASSE RÉELLEMENT]
- Environnement : [OS, VERSION, DÉPENDANCES]
- Ce qui a été essayé : [TES TENTATIVES PRÉCÉDENTES]

TÂCHE:
1. Identifie la cause racine (pas juste le symptôme)
2. Propose la correction minimale et propre
3. Explique POURQUOI ce bug existe
4. Suggère comment éviter ce type de bug à l'avenir

CONTRAINTE: Ne change pas plus de code que nécessaire pour la correction.
```

---

### 📊 TEMPLATE — Analyse & Documentation

```
RÔLE: Tu es un expert en [DOMAINE] avec la capacité d'expliquer des concepts 
      complexes de façon claire et structurée.

CONTEXTE:
- Public du document : [DÉVELOPPEURS JUNIORS / SENIORS / NON-TECH]
- Contexte d'utilisation : [README / DOC API / RAPPORT / WIKI]
- Niveau de détail souhaité : [SURVOL / COMPLET / EXHAUSTIF]

TÂCHE: [CE QU'IL FAUT ANALYSER OU DOCUMENTER]

FORMAT:
- Structure avec titres hiérarchiques
- Exemples de code pour chaque concept clé
- Tableau récapitulatif si applicable
- Glossaire des termes techniques en bas
```

---

## 🔑 TECHNIQUES AVANCÉES D'INGÉNIERIE DE PROMPT

### 1. Chain of Thought (CoT) — Force le raisonnement étape par étape
```
Avant de coder, réfléchis étape par étape à :
1. Quel est le vrai problème à résoudre ?
2. Quelles sont les 3 approches possibles ?
3. Laquelle est la meilleure et pourquoi ?
Ensuite seulement, génère le code.
```

### 2. Few-Shot Examples — Montre avant de demander
```
Voici un exemple de ce que je veux (style, qualité, format) :

[EXEMPLE POSITIF ICI]

Et voici ce que je ne veux PAS :

[EXEMPLE NÉGATIF ICI]

Maintenant génère [TA DEMANDE] en suivant exactement ce style.
```

### 3. Role Escalation — Monte en expertise progressive
```
Niveau 1 : "Explique X simplement"
Niveau 2 : "Maintenant donne une implémentation basique"
Niveau 3 : "Optimise pour la production avec gestion d'erreurs"
Niveau 4 : "Ajoute les tests et la documentation"
```

### 4. Constraint-First Prompting — Les contraintes en tête
```
AVANT de générer quoi que ce soit, confirme que tu as bien compris ces contraintes :
- [CONTRAINTE 1]
- [CONTRAINTE 2]
- [CONTRAINTE 3]
Dis "Compris, je vais respecter ces contraintes" puis génère.
```

### 5. Structured XML Tags — Pour les prompts complexes
```xml
<task>Crée un système d'authentification</task>
<tech>React + Supabase + TypeScript</tech>
<features>
  <feature>Login par email/mot de passe</feature>
  <feature>Refresh token automatique</feature>
  <feature>Redirection après login</feature>
</features>
<constraints>
  <constraint>Pas de bibliothèques auth tierces</constraint>
  <constraint>Gestion complète des erreurs</constraint>
</constraints>
<output>Code complet + explication de chaque fichier</output>
```

### 6. Intent Mirror — Fais reformuler avant d'exécuter
```
Avant de commencer, reformule ma demande avec tes propres mots 
pour t'assurer que tu as bien compris mon intention profonde.
Si ta reformulation est correcte, je dirai "GO" pour que tu commences.
```

### 7. Decomposition Prompt — Divise pour mieux régner
```
Cette tâche est complexe. Décompose-la en sous-tâches numérotées,
estime la difficulté de chacune (1-5), et dis-moi dans quel ordre 
tu vas les traiter. Attends ma validation avant de commencer.
```

---

## 📏 RÈGLES D'OR — LE CODE DE QUALITÉ

Intègre ces exigences dans TOUS tes prompts de code :

```markdown
### STANDARDS DE QUALITÉ OBLIGATOIRES

LISIBILITÉ:
- Noms de variables descriptifs (pas de x, tmp, data)
- Fonctions courtes (<30 lignes idéalement)
- Un seul niveau d'abstraction par fonction
- Commentaires sur le POURQUOI, pas le QUOI

ROBUSTESSE:
- Toujours gérer le cas d'erreur (try/catch ou .catch())
- Valider les inputs avant traitement
- Aucun console.log laissé en production
- Pas de valeurs hardcodées (utilise des constantes)

PERFORMANCE:
- Éviter les boucles imbriquées inutiles
- Mémoriser / cacher ce qui est coûteux à calculer
- Lazy loading si l'élément n'est pas visible immédiatement

MAINTENABILITÉ:
- DRY : Don't Repeat Yourself
- SOLID principles respectés
- Séparation claire logique / UI / données
```

---

## 🚀 PROMPTS D'AMORÇAGE RAPIDE

Copie-colle ces préfixes selon ta situation :

**Pour du code rapide mais de qualité :**
```
[MODE PRODUCTION] Tu es un senior dev. Génère du code clean, typé, avec gestion d'erreurs. 
Pas de raccourcis, pas de TODO. Voici ma demande : ...
```

**Pour explorer des options :**
```
[MODE EXPLORATION] Donne-moi 3 approches différentes pour résoudre ce problème,
avec les avantages et inconvénients de chacune. Ne code pas encore. Demande : ...
```

**Pour du refactoring :**
```
[MODE REFACTORING] Analyse ce code, identifie tous les problèmes (lisibilité, 
performance, sécurité, maintenabilité), puis propose une version améliorée 
en expliquant chaque changement. Code : ...
```

**Pour de la compréhension :**
```
[MODE EXPLICATION] Explique ce code comme si j'avais 5 ans, puis comme si j'étais 
un dev senior. Deux niveaux d'explication. Code : ...
```

**Pour une feature complète :**
```
[MODE FEATURE COMPLÈTE] Implémente cette fonctionnalité de A à Z :
backend + frontend + tests + documentation inline.
Ne laisse rien d'incomplet. Feature : ...
```

---

## ⚠️ ANTI-PATTERNS — CE QUI SABOTE TES RÉSULTATS

| ❌ Erreur commune | ✅ Correction |
|---|---|
| "Fais une app" | "Crée le module X avec les fonctionnalités Y et Z" |
| "Améliore mon code" | "Améliore les performances de la fonction fetchData() — elle est trop lente" |
| "C'est pas bon" | "Le résultat manque [X]. Voici ce que j'attendais : [exemple]" |
| "Fais mieux" | "Rends la réponse 50% plus courte en gardant les points clés" |
| Prompt trop vague | Prompt avec contexte + contraintes + format de sortie |
| Tout dans une demande | Décompose en étapes séquentielles |
| Pas de feedback | Évalue le résultat et itère avec précision |

---

## 🔄 BOUCLE D'ITÉRATION — Quand le résultat n'est pas parfait

```
ÉTAPE 1 — DIAGNOSTIC
"Le résultat est [bon à X%]. Ce qui manque : [liste précise]"

ÉTAPE 2 — CORRECTION CIBLÉE
"Garde tout sauf [PARTIE SPÉCIFIQUE]. Remplace-la par [CE QUE TU VEUX]"

ÉTAPE 3 — VALIDATION
"C'est mieux. Maintenant applique le même traitement à [PARTIE SUIVANTE]"

ÉTAPE 4 — CONSOLIDATION
"Assemble les parties en un seul résultat cohérent et propre"
```

---

## 🧩 MÉTA-PROMPT UNIVERSEL

> Utilise ce prompt pour améliorer N'IMPORTE QUEL autre prompt avant de l'envoyer :

```
Tu es un expert en ingénierie de prompt. Voici mon prompt brut :

[TON PROMPT BRUT ICI]

Améliore-le pour :
1. Clarifier l'intention profonde
2. Ajouter le contexte manquant
3. Définir précisément le format de sortie attendu
4. Ajouter les contraintes implicites
5. Le rendre 3x plus précis sans le rendre 3x plus long

Retourne le prompt amélioré directement, sans explication.
```

---

## 📦 CONTEXTE PERSONNEL (À PERSONNALISER)

> **Complète cette section avec TES informations.** Elle sera utilisée dans chaque prompt pour donner le contexte de base.

```markdown
### MON CONTEXTE DE DÉVELOPPEUR

Niveau : [Junior / Mid / Senior]
Stack principale : [tes technologies]
Frameworks préférés : [tes frameworks]
Style de code : [tes conventions]
Projets actuels : [tes projets en cours]
Objectifs : [ce que tu veux accomplir]
Points faibles à améliorer : [où tu as besoin d'aide]

### MES STANDARDS
- Langue du code : [Français / Anglais]
- Style de commentaires : [JSDoc / inline / aucun]
- Tests : [Jest / Vitest / aucun pour l'instant]
- Linter : [ESLint / Prettier / config custom]
```

---

## 🎓 RÉFÉRENCE RAPIDE — MOTS-CLÉS MAGIQUES

Ces mots dans tes prompts déclenchent des comportements spécifiques :

| Mot-clé | Effet |
|---|---|
| `"production-ready"` | Code robuste avec gestion d'erreurs |
| `"step by step"` | Raisonnement détaillé avant action |
| `"think carefully"` | Activation du mode réflexion approfondie |
| `"no placeholders"` | Aucun TODO ou code incomplet |
| `"explain your choices"` | Justification de chaque décision |
| `"minimal changes"` | Modification chirurgicale uniquement |
| `"alternatives"` | Génère plusieurs options |
| `"trade-offs"` | Analyse avantages/inconvénients |
| `"edge cases"` | Couvre les cas limites |
| `"battle-tested"` | Approche éprouvée, pas expérimentale |

---

## 📋 CHECKLIST AVANT D'ENVOYER UN PROMPT

- [ ] Ai-je défini un **rôle expert** pour l'IA ?
- [ ] Ai-je fourni assez de **contexte** (stack, projet, contraintes) ?
- [ ] Ma **tâche** est-elle formulée avec des verbes d'action précis ?
- [ ] Ai-je listé ce que je ne veux **PAS** (anti-exemples) ?
- [ ] Ai-je précisé le **format de sortie** attendu ?
- [ ] Est-ce que je demande **une chose à la fois** ?
- [ ] Mon prompt est-il **compréhensible sans télépathie** ?

---

*Ce fichier est vivant. Mets-le à jour au fil de tes apprentissages.*  
*Chaque prompt parfait que tu trouves mérite d'être archivé ici.*

---
> 🔗 Inspiré de : Anthropic Prompt Engineering Docs · GitHub awesome-ai-system-prompts · 
> Claude Code Best Practices · Production patterns des meilleurs agents 2025/2026
```
