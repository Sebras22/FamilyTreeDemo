# FamilyTreeDemo

Version **démo** de l'interface d'arbres généalogiques (React, TypeScript, Vite, Mantine, React Flow).

- 100 % statique : aucun serveur, aucun compte, aucune base de données.
- L'API est simulée **en mémoire** dans le navigateur.
- **Rien n'est sauvegardé** : toutes les modifications disparaissent au rechargement de la page.
- Un arbre d'exemple est chargé au démarrage.
- L'import / export GEDCOM est réalisé en TypeScript, dans le navigateur : les fichiers ne sont jamais envoyés quelque part.

## Lien avec FamilyTreeFront

FamilyTreeDemo reprend le code de FamilyTreeFront (le vrai front, branché sur FamilyTreeBack) et ne s'en écarte que là où c'est nécessaire : API en mémoire à la place du backend, pas d'authentification, pas de partage serveur. Les différences sont listées dans [`DIVERGENCES.md`](./DIVERGENCES.md).

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

Dans les exemples ci-dessous, `arbora.exemple.fr` est un domaine fictif à remplacer par le vôtre. Les libellés des interfaces des hébergeurs peuvent évoluer : référez-vous à leur documentation en cas d'écart.

### Cloudflare Pages

1. Poussez le dépôt sur GitHub ou GitLab.
2. Tableau de bord Cloudflare, Workers & Pages, créer un projet Pages, le connecter au dépôt.
3. Réglages de build : framework « None » (ou Vite), commande `npm run build`, dossier de sortie `dist`.
4. Lancez le déploiement. Le site est d'abord disponible sur une adresse `*.pages.dev`.
5. Onglet « Custom domains » du projet, « Set up a custom domain », saisissez `arbora.exemple.fr`.
6. Si le domaine est géré chez Cloudflare, l'enregistrement DNS est créé automatiquement. Sinon, chez votre registraire, ajoutez un enregistrement `CNAME` : nom `arbora` (pour `arbora.exemple.fr`), valeur `<projet>.pages.dev`.
7. Le certificat HTTPS est émis automatiquement après validation du DNS.

Un domaine « nu » (`exemple.fr`, sans sous-domaine) demande que la zone DNS soit gérée par Cloudflare.

### Netlify

1. Poussez le dépôt sur GitHub, GitLab ou Bitbucket.
2. « Add new site », « Import an existing project », choisissez le dépôt.
3. Commande de build `npm run build`, dossier de publication `dist`.
4. Déployez : le site est disponible sur une adresse `*.netlify.app`.
5. « Domain management », « Add a domain », saisissez `arbora.exemple.fr`.
6. Chez votre registraire, ajoutez un enregistrement `CNAME` : nom `arbora`, valeur `<site>.netlify.app` (ou déléguez le DNS à Netlify).
7. Une fois le DNS propagé, activez/validez le certificat HTTPS (Let's Encrypt) dans « HTTPS » ; il est ensuite renouvelé automatiquement.

### GitHub Pages

GitHub Pages ne lit ni `_redirects` ni `_headers` : le repli SPA et les en-têtes de sécurité ne sont pas pris en charge de la même façon.

1. Dans les réglages du dépôt, « Pages », source « GitHub Actions ».
2. Ajoutez un workflow qui exécute `npm ci`, `npm run build`, puis publie `dist` (actions `actions/upload-pages-artifact` et `actions/deploy-pages`).
3. **Repli SPA** : GitHub Pages sert `404.html` pour les chemins inconnus (avec un code 404). Contournement courant : copier `index.html` en `404.html` après le build, par exemple en ajoutant `cp dist/index.html dist/404.html` dans le workflow. Ce fichier n'est volontairement pas versionné dans ce dépôt. Les pages s'affichent mais avec un statut HTTP 404, ce qui est acceptable pour une démo, moins pour le référencement.
4. **Chemin de base** : sur une adresse `utilisateur.github.io/depot/`, l'application serait servie dans un sous-dossier, ce qui demande de régler `base` dans `vite.config.ts` et le `basename` du routeur. Avec un domaine personnalisé à la racine (`arbora.exemple.fr`), ce n'est pas nécessaire : privilégiez cette option.
5. Réglages, « Pages », « Custom domain » : saisissez `arbora.exemple.fr`.
6. Chez votre registraire, ajoutez un enregistrement `CNAME` : nom `arbora`, valeur `<utilisateur>.github.io`.
7. Cochez « Enforce HTTPS » quand le certificat est disponible.

### Vérifier après déploiement

- Ouvrir directement une sous-page (pas seulement la racine) et la recharger : elle ne doit pas renvoyer une erreur 404 de l'hébergeur (sur GitHub Pages, voir le point 3 ci-dessus).
- Contrôler que l'adresse est bien servie en HTTPS.
- Vérifier que les modifications disparaissent au rechargement, comportement attendu de la démo.

## Notes

- Aucune variable d'environnement n'est nécessaire pour le déploiement.
- Qualité : `npm test`, `npm run lint`, `npm run knip`.
- Sécurité : `public/_headers` (Cloudflare Pages, Netlify) et `nginx/security-headers.conf` (Docker) posent une politique `Content-Security-Policy` stricte (aucun script externe, aucune connexion réseau), `X-Frame-Options`, `Permissions-Policy` et `Referrer-Policy`. Sur GitHub Pages, ces en-têtes ne sont pas pris en compte.
- Import GEDCOM limité à 20 Mo et 20 000 individus.
