# Name Codex

**Application de gouvernance de nommage** — standards de nommage Microsoft 365 & Azure, rendus visuels.

L'application est déployée et accessible sur https://name-codex.jeremymaillot.fr/.

Name Codex est une application monopage qui vous aide à définir, explorer et gouverner les conventions de nommage pour Azure, Microsoft 365, Intune, Defender, Exchange et les groupes. Choisissez un type d'objet, assemblez ses segments, et l'application génère, valide et documente le nom final en temps réel.

![Capture d'écran Name Codex](./docs/screenshot.png)

## Fonctionnalités

### Explorer les standards de nommage
- Parcourez les conventions par catégorie : Azure, Entra ID, Exchange, Groups, Intune, Conditional Access, Defender, Teams, SharePoint, Power Platform, Purview (11 catégories, 45 conventions)
- Recherchez et filtrez les types d'objets, et basculez entre leurs variantes de modèle
- Consultez la description active et un exemple pour chaque convention

### Constructeur de segments
- Assemblez visuellement un nom à partir de segments (sensible aux séparateurs)
- Les segments peuvent être **fixes** (premier/dernier), **verrouillés**, **recommandés**, ou libres d'être réordonnés
- Réordonnez, supprimez ou ajoutez des segments personnalisés en un clic
- Infobulles sur chaque libellé de segment pour comprendre ce qu'il représente
- **Littéraux dans les modèles** : du texte fixe peut être intégré dans un modèle (par ex. un préfixe `DEF-` ou un mot-clé `ENABLEINEMERGENCY`) et est toujours régénéré ; les segments vides ou optionnels sont automatiquement repliés
- Info-bulles sur les puces multi-sélection montrant la description de chaque valeur choisie
- Affichage du modèle en direct avec un badge **Modifié** lorsque vous déviez de la convention

### Validation & gouvernance
- Aperçu du nom en direct respectant les règles de validation de la convention (longueur, caractères autorisés, segments obligatoires)
- **Score de gouvernance /100** avec une checklist par règle
- Exemples de politiques pour Conditional Access

### Gouvernance des segments
- **Exclusions mutuelles** : sélectionner une valeur désactive son opposé (par ex. *Appareil de confiance* vs *Appareil non fiable*, *MFA* vs *Force MFA*) pour qu'une politique ne puisse pas être contradictoire
- **Valeurs conditionnelles** : les choix proposés pour un segment peuvent dépendre d'un autre segment (par ex. les types de profils de points de terminaison filtrés par le système d'exploitation choisi)
- **Identifiants numérotés automatiquement** : identifiants de politique à préfixe fixe avec numérotation intégrée (par ex. `CA001`, `EM001`, `DEVSEC001`) et plages basées sur les rôles pour Conditional Access

### Sortie & persistance
- Copiez le nom généré ou la documentation Markdown complète dans le presse-papiers
- Enregistrez des **favoris** et conservez un **historique** des noms copiés (localStorage, conservé entre les sessions)
- Restaure automatiquement le dernier objet sélectionné dans chaque catégorie
- **Référence des conventions** : un dictionnaire de valeurs pour chaque segment utilisé

### Basé sur les données
Toutes les conventions, bibliothèques de segments et générateurs sont en JSON brut sous `src/rules`, `src/data/segments`, `src/data/generators` — ajoutez ou ajustez un standard de nommage sans toucher au code. Les définitions de segments partagées se trouvent dans `segment-catalog.json` ; chaque règle référence des bibliothèques et peut les restreindre ou les remodeler avec `allowedValues`, des exclusions mutuelles et des littéraux de modèle. Les bibliothèques de segments peuvent déclarer des contraintes de valeurs — voir [docs/DATA-FORMAT_FR.md](docs/DATA-FORMAT_FR.md) pour le format et ses règles de validation.

## Pile technique

React + TypeScript + Vite, avec toutes les données stockées localement en JSON (aucun backend).

## Guide de l'utilisateur

### 1. Choisir une catégorie
Choisissez une catégorie dans la barre latérale — Azure, Entra ID, Exchange, Groups, Intune, Conditional Access, Defender, Teams, SharePoint, Power Platform, Purview. Le dernier objet sélectionné dans chaque catégorie est restauré automatiquement lors de votre prochaine visite.

### 2. Sélectionner un type d'objet
Utilisez le champ de recherche pour filtrer les types d'objets, et basculez entre les variantes de modèle si l'objet en propose plusieurs. Chaque convention affiche sa description active et un exemple.

### 3. Assembler vos segments
Construisez le nom segment par segment :
- Les segments **fixes** (premier/dernier) sont pré-positionnés et ne peuvent pas bouger ; les segments **verrouillés** conservent leur valeur ; les segments **recommandés** vous guident tout en restant modifiables
- Cliquez sur un segment pour choisir une valeur — les puces multi-sélection affichent une info-bulle décrivant chaque valeur
- Réordonnez, supprimez ou ajoutez des segments personnalisés en un clic
- Survolez les astuces sur chaque libellé de segment pour comprendre ce qu'il représente
- Les littéraux intégrés au modèle (par ex. un préfixe `DEF-` ou le mot-clé `ENABLEINEMERGENCY`) sont régénérés automatiquement ; les segments vides ou optionnels se replient d'eux-mêmes

### 4. Respecter les règles de gouvernance
- Certaines valeurs sont **mutuellement exclusives** : en sélectionner une désactive son opposé (par ex. *Appareil de confiance* vs *Appareil non fiable*, *MFA* vs *Force MFA*)
- Les choix proposés peuvent dépendre d'un autre segment (par ex. les types de profils de points de terminaison filtrés par le système d'exploitation choisi)
- Les identifiants de politique sont **numérotés automatiquement** (par ex. `CA001`, `EM001`, `DEVSEC001`) avec des plages basées sur les rôles pour Conditional Access

### 5. Valider et vérifier votre score
Observez l'aperçu en direct respecter les règles de validation de la convention (longueur, caractères autorisés, segments obligatoires). Un badge **Modifié** apparaît lorsque vous déviez de la convention. Suivez votre **score de gouvernance /100** avec sa checklist par règle.

### 6. Enregistrer ou partager
- Copiez le nom généré ou la **documentation Markdown complète** dans le presse-papiers
- Marquez-le comme **favori** ou conservez-le dans votre **historique** (les deux persistent localement entre les sessions)
- Consultez la **Référence des conventions** pour un dictionnaire de valeurs de chaque segment utilisé

## Construisez-le vous-même

### 1. Installer Node.js

Téléchargez et installez la dernière version **LTS** depuis <https://nodejs.org/>.

Vérifiez l'installation depuis un terminal :

```bash
node -v
npm -v
```

Les deux commandes doivent afficher un numéro de version.

### 2. Cloner le dépôt

```bash
git clone https://github.com/jmaillot/name-codex.git
cd name-codex
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez l'URL locale affichée dans le terminal (généralement <http://localhost:5173/>) dans votre navigateur.

### Scripts disponibles

| Script                  | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Lancer le serveur de développement (HMR)                   |
| `npm run build`         | Vérifier les types et compiler pour la prod                |
| `npm run lint`          | Exécuter oxlint                                            |
| `npm run check:data`    | Valider tous les fichiers JSON de données (96 fichiers)    |
| `npm run check:tokens`  | Valider les tokens de design (0 littéraux, 18/18 WCAG)     |
| `npm test`              | Lancer les tests unitaires Vitest (jsdom, 226 tests)       |
| `npm run test:watch`    | Lancer les tests en mode watch                             |
| `npm run test:coverage` | Lancer les tests avec couverture v8 (80% lignes sur src/lib) |
| `npm run preview`       | Prévisualiser la compilation de production                 |

La compilation de production est générée dans `dist/` et peut être servie par n'importe quel serveur de fichiers statiques.
