# FamilyTreeDemo

Version **démo** de l'interface d'arbres généalogiques (React, TypeScript, Vite, Mantine, React Flow).

- 100 % statique : aucun serveur, aucun compte, aucune base de données.
- L'API est simulée **en mémoire** dans le navigateur.
- **Rien n'est sauvegardé** : toutes les modifications disparaissent au rechargement de la page.
- Un arbre d'exemple est chargé au démarrage.
- L'import / export GEDCOM est réalisé en TypeScript, dans le navigateur : les fichiers ne sont jamais envoyés quelque part.

## Lien avec FamilyTreeFront

FamilyTreeDemo reprend le code de FamilyTreeFront (le vrai front, branché sur FamilyTreeBack) et ne s'en écarte que là où c'est nécessaire : API en mémoire à la place du backend, pas d'authentification, pas de partage serveur.

## Commandes

```bash
npm install        # dépendances
npm run dev        # serveur de développement : http://localhost:5173
npm run build      # vérification TypeScript + build de production dans dist/
npm run preview    # sert dist/ en local : http://localhost:4173
npm test           # tests unitaires (Vitest)
```

## Docker (test local du build statique)

nginx sert uniquement les fichiers statiques, avec repli vers `index.html` (routage côté client), les en-têtes de sécurité et un cache long sur `/assets/`.

```bash
docker build -t familytree-demo .
docker run --rm -p 3000:80 familytree-demo
# ou : docker compose up --build
```

Application : http://localhost:3000

## Déploiement

Le résultat à publier est le dossier `dist/` produit par `npm run build`. Pour tous les hébergeurs :

- **Commande de build** : `npm run build`
- **Dossier de sortie** : `dist`
- **Version de Node** : 22 (ou plus récente)
- **Repli SPA** : l'application utilise `BrowserRouter` ; un accès direct à une URL comme `/trees/1` doit renvoyer `index.html`. Les fichiers `public/_redirects` et `public/_headers` sont copiés dans `dist/` au build et sont lus par Cloudflare Pages et Netlify.

