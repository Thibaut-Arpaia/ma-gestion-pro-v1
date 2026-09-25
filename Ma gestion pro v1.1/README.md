# Ma Gestion Pro — V1 web pour GitHub Pages

Version préparée le 25 septembre 2026. Pas encore publiée ni validée sur le PC utilisateur.

## Ce qui est inclus

Interface web avec décor Lucky Dinner, dépenses, point de départ, modification, annulation, références continues, statistiques de dépenses, sauvegarde et restauration JSON. Le travail s'enregistre dans un dossier réel du PC choisi par l'utilisateur. Aucun service serveur ni connexion ChatGPT, Google, GitHub ou pCloud n'est nécessaire à l'usage de l'application une fois publiée.

À chaque nouvelle session, cliquer sur « Ouvrir mon dossier » pour retrouver les comptes. L'accès demande un navigateur compatible et une adresse HTTPS. Si le navigateur refuse l'accès, aucun enregistrement silencieux dans son stockage interne ne remplace le dossier choisi. Les copies de l'état précédent sont placées dans le sous-dossier `sauvegardes` avant les changements. La synchronisation pCloud est configurée et gérée séparément par l'utilisateur.

Premier bloc de test uniquement : recettes, calculatrice complète de commission, justificatifs et déclarations restent à intégrer. Le visuel est une première intégration, pas une validation du rendu final. La version mobile et la synchronisation entre appareils ne sont pas validées. Le site n'est pas encore une PWA hors connexion.

## Publication

Le contenu de ce dossier est destiné à la racine d'un dépôt GitHub distinct, pas à être mélangé avec l'ancien serveur. Aucun fichier comptable réel ne doit être ajouté au dépôt.

Le workflow `.github/workflows/pages.yml` teste puis publie les seuls fichiers de l'interface. Dans les réglages du dépôt, choisir Pages → Source : GitHub Actions. Le workflow se lance sur la branche `main` et fournit l'adresse de publication. Vérifier celle-ci sans session ChatGPT, puis sur le PC de l'utilisateur.

GitHub Free fournit Pages pour un dépôt public ; le code publié est visible. Les conditions GitHub Pages et leur portée pour l'usage professionnel individuel restent à clarifier comme indiqué dans l'audit. Aucun abonnement ni domaine payant n'est prévu dans ce paquet.

## Vérifications effectuées

- Syntaxe JavaScript vérifiée.
- Tests automatisés : montants, historique, références réservées, annulation, lecture après réouverture, sauvegarde/restauration, fichier invalide, écritures sérialisées et échec d'écriture sans altération du fichier.
- Ces tests utilisent le système de fichiers temporaire de Node avec une simulation des accès du navigateur. Ils ne prouvent pas l'autorisation d'accès réelle dans Opera.
- Déploiement GitHub, rendu dans le navigateur et accès au dossier sur PC : à vérifier après connexion et publication.

Commande de test : `node --test tests/local.test.mjs` (Node 22 ou supérieur).
