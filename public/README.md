# Ma Gestion Pro — V4 web pour GitHub Pages

Version V4 préparée le 8 octobre 2026. Fond personnalisable validé sur PC.

## Ce qui est inclus

- Dashboard avec visuel immobilier clair V3, menu gauche arrondi, indicateurs TVA/URSSAF et argent réellement libre.
- Actions rapides Dashboard : ajouter une dépense ou une recette.
- Dépenses, recettes, justificatifs, corbeille de tickets et alertes de doublons.
- Rapprochement bancaire manuel avec pointage, clôture, réouverture, confettis et son.
- Calculatrice de commission agence TTC avec barème progressif.
- Bilan mensuel/annuel avec détails, provisions fiscales de la période et enveloppes cumulées.
- Récurrences mensuelles et virement personnel sans TVA ni provision fiscale.
- Contrôles Dashboard : doublons, tickets manquants et pointages en attente jusqu’à aujourd’hui.
- Personnalisation du fond d’écran depuis Réglages & sauvegardes, sans modifier l’interface. L’image est conservée dans le dossier `fonds/` du compte pour éviter d’alourdir le fichier principal.
- Téléchargement d’une copie complète JSON de secours.

Les comptes restent dans le dossier local choisi par l’utilisateur. Aucun fichier comptable réel ne doit être ajouté au dépôt GitHub.

## Utilisation

À chaque session, cliquer sur **Ouvrir mon dossier** pour retrouver les comptes. L’accès demande un navigateur compatible File System Access API et une page HTTPS. Les copies de sécurité sont placées dans le sous-dossier `sauvegardes`.

Le bouton **Télécharger une copie complète** exporte un JSON de secours immédiat. Cette copie contient aussi les tickets, récurrences, préférences, fond personnalisé et opérations supprimées conservées.

La synchronisation pCloud est gérée séparément par l’utilisateur. La version mobile et la synchronisation bidirectionnelle ne sont pas encore validées comme module complet.

## Publication GitHub

Ce projet doit être livré comme **ZIP complet GitHub**, pas comme simple dossier `public/`.

Le paquet complet doit contenir au minimum :

- `.github/workflows/pages.yml`
- `index.html`
- `app.js`
- `style.css`
- `model.mjs`
- `storage.mjs`
- `receipts.mjs`
- `reconciliation.mjs`
- `reconciliation-ui.mjs`
- `assets/`
- `tests/`
- `verify-public.mjs`

Le workflow reconstruit le dossier `public` avant publication. Il doit conserver :

```sh
rm -rf public
mkdir public
```

## Contrôles avant livraison

Avant de remettre un ZIP à l’utilisateur :

```sh
node --check app.js
node --check storage.mjs
node --test tests/*.test.mjs
rm -rf public
mkdir public
touch public/.nojekyll
cp index.html app.js style.css model.mjs storage.mjs receipts.mjs reconciliation.mjs reconciliation-ui.mjs public/
cp -R assets public/assets
node verify-public.mjs public
```

Après création du ZIP, lister son contenu et confirmer :

- tests OK ;
- workflow simulé OK ;
- ZIP complet OK ;
- nombre de fichiers ;
- type de ZIP : **ZIP complet GitHub**.

## Règle importante

Ne pas livrer un ZIP contenant seulement `public/`. Cette erreur a déjà causé un échec GitHub Actions et ne doit plus se reproduire.

## Règle de collaboration

Thibaut porte le besoin métier, les retours d’usage et les validations sur son PC. L’assistant porte la méthode de développement : cohérence technique, garde-fous, tests, packaging GitHub et prévention des erreurs déjà rencontrées.

Si une demande ou une manipulation risque de casser les données, le workflow, le packaging ou une décision validée, l’assistant doit le signaler et proposer une option plus sûre avant d’agir.
