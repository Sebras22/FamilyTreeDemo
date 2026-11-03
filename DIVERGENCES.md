# Divergences avec FamilyTreeFront

FamilyTreeDemo est une copie de FamilyTreeFront dont l'API HTTP est remplacee par une API en memoire (aucun compte, aucun serveur, rien n'est enregistre). Les composants, hooks, tests, interfaces (`src/interfaces/<domaine>/<Nom>.ts`), logique du domaine et styles de l'arbre sont communs avec le front (ils ont ete reportes tels quels sur FamilyTreeFront et FamilyTreeLocal). Tout ce qui n'est pas liste ici est identique au front, sauf le CSS que la demo a elague. Pour resynchroniser : recopier les fichiers communs du front, sauf ceux ci-dessous (a fusionner a la main ou a conserver).

## Fichiers ajoutes (n'existent pas dans le front)

- `src/shared/api/apiError.ts` : classe `ApiError`, sortie de `api.ts` pour eviter un import circulaire (le front la definit dans `api.ts`).
- `src/shared/api/demo/demoApi.ts` : API en memoire (implemente l'interface `Api`, calquee sur les regles du back). Les methodes sans objet en demo (authentification, compte, partage, membres, invitations, recherche, photo partagee) ne figurent ni dans l'interface `Api` ni dans cette implementation.
- `src/shared/api/demo/store.ts` : etat en memoire (arbres, personnes, liens...).
- `src/shared/api/demo/seed.ts` : charge l'arbre d'exemple au demarrage.
- `src/shared/api/demo/gedcom.ts` : import/export GEDCOM en TypeScript (equivalent du back).
- `src/shared/api/demo/famille-delacroix.ged` : arbre d'exemple (54 personnes).
- `DIVERGENCES.md` (ce fichier). Hors `src/` : README, Dockerfile, nginx, docker-compose, .dockerignore, `.env*`, `public/` sont geres separement.

## Fichiers supprimes (existent dans le front)

- `src/features/auth/` (AuthPage, GoogleButton) : connexion / inscription.
- `src/features/account/pages/AccountPage.tsx` : page de compte. `PrivacyPage.tsx` est conserve.
- `src/features/sharing/` (ShareDialogs, InvitePage, SharedPage) : partage, membres, invitations.
- `tsconfig.tsbuildinfo` n'est pas versionne (genere).

## Fichiers modifies

- `package.json` : `name` = `FamilyTreeDemo`. Dependances et versions identiques.
- `package-lock.json` : champs `name` uniquement.
- `vite.config.ts` : suppression du proxy `/api`.
- `src/vite-env.d.ts` : rien de plus que la reference `vite/client` (pas de `VITE_DEMO`; il n'y a plus de drapeau DEMO).
- `src/shared/api/api.ts` : tout le code HTTP (fetch, jetons, refresh, download, blob, `httpApi`) est supprime. Conserve : types (`Sex`, `LinkType`, ..., `ShareMode`), reexport de `ApiError`. Ajoute : interface `Api` ecrite explicitement (signatures identiques a `httpApi` du front ; a mettre a jour si le front ajoute/modifie un endpoint, et a implementer dans `demoApi.ts`), et `export const api: Api = demoApi`. `refreshSession`, `setAccessToken`, `setSessionLostHandler` n'existent plus.
- `src/shared/auth/AuthContext.tsx` : simplifie. Le visiteur fixe vient de `api.me()` ; plus de login/register/google/logout/refresh. `useAuth()` renvoie `{ user }`.
- `src/interfaces/state/AuthState.ts` : `AuthState` reduit a `{ user }`.
- `src/interfaces/components/GoogleButtonProps.ts` : supprime (knip).
- `src/app/App.tsx` : plus de `RequireAuth`/`WaitSession`; routes limitees a `/`, `/trees/:treeId`, `/trees/:treeId/persons/:personId`, `/privacy`, `*`. Routes `/login`, `/register`, `/account`, `/shared/*`, `/invite/*` retirees.
- `src/features/persons/pages/PersonPage.tsx` : `SharedPersonPage` supprime (et les imports devenus inutiles).
- `src/features/persons/hooks/photos.tsx` : plus de contexte `PhotoSource` ni d'appel a `sharedPhoto` (les photos viennent toujours de `api.photo`).
- `src/features/trees/pages/TreePage.tsx` : boutons Partager et Membres, dialogs et etat `dialog` retires ; `primaryAction` non fourni.
- `src/features/trees/pages/TreesPage.tsx` : bandeau `demo.banner` (classe `notice`) ajoute ; les conseils « Invitez votre famille » et « Partagez en lecture seule » sont retires de la liste `tips` (n'ont pas de sens en demo).
- `src/shared/layout/AppHeader.tsx` : boutons compte et deconnexion remplaces par un badge `chip` « Demo » (`demo.badge`, titre `demo.banner`).
- `src/shared/i18n/locales.ts` : ajout des cles `demo.badge` et `demo.banner` (FR et EN). Les cles devenues mortes (auth, compte, partage, membres, invitations, conseils d'invitation et de partage) sont supprimees, et le texte de la politique de confidentialite (`privacy.*`) est reecrit pour la demo (aucune donnee collectee, preferences en stockage local).

## Notes

- `src/styles/auth.css` est supprime (la classe `.hero-shade`, encore utilisee, est dans `trees.css`) ainsi que les regles CSS sans element correspondant (anciennes modales, cartes d'arbres, ecran de connexion).
- `src/interfaces/api/` : les types `AuthResponse`, `Share`, `ShareMode`, `Member`, `Invitation` et `SharedTree` sont supprimes ; `User` se limite a `id` et `displayName` et `Tree` n'a plus de `shareMode`.
- Toutes les interfaces et tous les types sont dans `src/interfaces/<domaine>/<Nom>.ts`, un par fichier (api, components, demo, domain, i18n, state, theme, ui, window).
