# Format des données : bibliothèques de segments et contraintes

Ce document est la référence contributeur pour la couche de données en JSON brut sous `src/rules/**`, `src/data/segments/**` et `src/data/generators/**`, avec un focus sur le vocabulaire optionnel `constraints` disponible pour les bibliothèques de segments.

## Forme d'une bibliothèque de segments

Une bibliothèque de segments est un fichier JSON unique avec ces clés de premier niveau :

| Clé | Type | Requis | Signification |
|-----|------|--------|---------------|
| `name` | string | oui | Nom d'affichage du segment (ex. `"Region"`) |
| `values` | array | oui | La liste des valeurs sélectionnables |
| `constraints` | object | non | Contraintes optionnelles sur les valeurs — voir [Vocabulaire des contraintes](#vocabulaire-des-contraintes) |

Chaque entrée de `values[]` est un objet :

- `value` — string, unique au sein du tableau `values[]` du fichier. Une chaîne vide intentionnelle (`""`) est autorisée comme sentinelle de valeur blanche.
- `description` — string non vide décrivant la valeur.

Exemple illustratif (forme adaptée de `src/data/segments/core/region.json`) :

```json
{
  "name": "Region",
  "values": [
    { "value": "WE", "description": "West Europe" }
  ]
}
```

## Vocabulaire des contraintes

Toute bibliothèque de segments peut déclarer UN objet `constraints` optionnel de premier niveau. Il s'applique au niveau du fichier à chaque valeur de `values[]`. Il comporte exactement trois clés :

| Clé | Type | Signification |
|-----|------|---------------|
| `allowedPattern` | string | Expression régulière brute avec des ancres explicites écrites par l'auteur — utilisée telle quelle, jamais enveloppée ni ancrée automatiquement (même convention que le `validation.allowedPattern` au niveau des règles) |
| `minLength` | entier ≥ 0 | Longueur minimale d'une valeur |
| `maxLength` | entier ≥ 0 | Longueur maximale d'une valeur |

Les clés sont indépendantes : omettez une clé pour laisser cet axe sans contrainte, et `constraints: {}` est une no-op valide.

Exemple bien formé (ex. `core/region` livre des contraintes live depuis v1.7) :

```json
{
  "name": "Region",
  "constraints": { "allowedPattern": "^[A-Z]{2,4}$", "minLength": 2, "maxLength": 4 },
  "values": [
    { "value": "WE", "description": "West Europe" }
  ]
}
```

### Déclarations mal formées et verdicts du gate

Le gate `check:data` rejette chacune de ces déclarations en CI/en dev :

| Déclaration | Verdict du gate |
|-------------|-----------------|
| `"allowedPattern": "["` | ÉCHEC : pas une expression régulière compilable |
| `"allowedPattern": 42` | ÉCHEC : doit être une string |
| `"minLength": -1` | ÉCHEC : doit être un entier non négatif |
| `"maxLength": 1.5` | ÉCHEC : doit être un entier non négatif |
| `"minLength": 5, "maxLength": 2` | ÉCHEC : minLength doit être ≤ maxLength |
| `"constraints": "^[A-Z]+$"` | ÉCHEC : constraints doit être un objet |

Les échecs sont rapportés en mode « collect-all » : le gate scanne chaque fichier et affiche une ligne texte `file: reason` par violation avant de sortir avec un code non nul.

## Ce que le gate vérifie — et ce qu'il ne vérifie pas

Le gate valide **uniquement la bonne formation de la déclaration** : il vérifie que `allowedPattern` est une string qui compile via `new RegExp()` (elle n'est jamais exécutée), et que `minLength`/`maxLength` sont des entiers non négatifs avec `minLength ≤ maxLength`.

Il ne vérifie PAS si les entrées existantes de `values[]` satisfont les contraintes déclarées, et il n'exécute jamais le motif sur aucune entrée. Les bibliothèques de segments peuvent déclarer `constraints: { allowedPattern, minLength, maxLength }` — live depuis v1.7 (live since v1.7). `allowedPattern` est une regex brute ancrée (ex. `"^[A-Z0-9]{2,4}$"`), jamais enveloppée ; `minLength`/`maxLength` sont des entiers ≥ 0 avec `minLength <= maxLength`. Validé par `check:data` (compilation seule) et appliqué dans le builder : listes filtrées par `allowedPattern`, saisies bridées par `maxLength`, lignes de validation pour les trois.
