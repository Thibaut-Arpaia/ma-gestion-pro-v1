# Cahier de notes V1 - Ma Gestion Pro

Date de creation : 25/09/2026

Objectif : suivre les tests reels de la V1, les corrections a faire et les decisions validees avant de considerer la V1 comme propre.

## Regle de travail permanente

- Toujours se baser en priorite sur les elements deja transmis par Thibaut : tableaux Excel, anciennes versions de calculatrice, captures, cahier des charges, notes de communication et decisions deja validees.
- Les modifications validees pendant les tests ou les versions suivantes viennent completer ou corriger ces elements de reference.
- En cas de doute ou de contradiction entre une ancienne source et une modification recente, demander confirmation avant de modifier la logique.
- Ne pas redefinir une regle de calcul ou une logique metier sans verifier la coherence avec les sources deja fournies.
- Quand Thibaut signale une erreur de calcul ou de logique, ne pas repondre par une nouvelle estimation rapide. Reprendre le calcul depuis la source de reference, verifier les etapes, corriger l'erreur et ne pas reproduire la meme erreur deux fois d'affilee.
- Incident du 01/10/2026 : la regle ci-dessus a ete immediatement enfreinte pendant le test calculatrice, avec une annonce erronee du cumul attendu apres modification d'une recette conseiller TTC a 28 000 EUR. Bonne valeur : 33 333,33 EUR HT, car 28 000 TTC / 1,20 = 23 333,33 HT, puis 23 333,33 / 70 % = 33 333,33 HT. Consigne renforcee : ne plus annoncer de montant attendu sans calcul explicite verifie.
- Incident du 01/10/2026 : pendant les tests dashboard du dossier 3, ne plus oublier le solde de depart dans les montants attendus. Regle renforcee : tout calcul de dashboard doit partir de l'etat complet du dossier ouvert, notamment point de depart + recettes actives - depenses actives - reserves TVA/URSSAF. Exemple de controle : avec un point de depart a 1 000 EUR, une recette "Autre recette" de 1 200 EUR TTC avec 200 EUR de TVA, puis une recette "Commission immobiliere" de 14 000 EUR TTC conseiller, le solde suivi attendu est 16 200 EUR, la TVA a reserver 2 533,33 EUR, l'URSSAF a reserver 3 261,67 EUR et l'argent reellement libre 10 405 EUR.

## Etat des tests valides

- Acces au logiciel depuis GitHub Pages : OK.
- Ouverture du dossier local Test : OK.
- Creation du fichier de comptes local : OK.
- Enregistrement du point de depart : OK.
- Creation d'une depense : OK.
- Modification d'une depense : OK.
- Suppression / annulation d'une depense : OK.
- Recalcul du dashboard apres modification et suppression : OK.
- Sauvegarde manuelle : OK.
- Restauration d'une sauvegarde : OK.
- Fermeture / reouverture avec recuperation des donnees depuis le dossier Test : OK.
- Sauvegarde avec plusieurs depenses, modification apres sauvegarde, puis restauration : OK.
- Liste complete des depenses avec 3 depenses actives : OK.
- Affichage des montants, categories, dates et references visibles dans la liste complete : OK.
- Recherche / filtrage dans la liste des depenses : OK.
- Controle des champs obligatoires a la saisie d'une depense : OK.
- Montant vide bloque : OK.
- Libelle vide bloque : OK.
- Categorie vide bloque : OK.
- Montant a 0 bloque : OK.
- Montant avec virgule francaise accepte : OK.
- Montant avec point decimal accepte : OK.
- TVA du ticket enregistree et conservee a la modification : OK.
- TVA du ticket conservee comme information sans fausser les totaux TTC du dashboard : OK.
- Dashboard et statistiques coherents apres ajout d'une depense avec TVA : OK.
- Les depenses supprimees ne reapparaissent pas dans les statistiques : OK.
- Retour a l'etat propre du dossier Test apres suppression de la depense TVA : OK.
- Controle visuel rapide PC des ecrans Dashboard, Depenses, Reglages & sauvegardes : OK.
- Tests V1 termines : OK.

## Corrections a faire

### 1. Numerotation des depenses - liste propre

Decision validee : la V1 doit fonctionner avec une logique de liste propre.

Comportement attendu :

- Si 3 depenses sont visibles, la prochaine reference doit etre 4.
- Une depense supprimee ne doit plus compter dans la prochaine reference.
- La prochaine reference doit se recalculer sur les depenses actives visibles.

Comportement constate :

- Apres les tests de creation, modification puis suppression, 3 depenses visibles affichent une prochaine reference a 5.
- Dans la liste complete, les 3 depenses actives apparaissent avec les references 2, 3 et 4. La prochaine reference affichee doit donc etre alignee sur la logique de liste propre.

Correction attendue :

- Remplacer la logique de reference actuelle par une logique simple : nombre de depenses actives + 1.
- Exemple : 3 depenses actives = prochaine reference 4.

Priorite : a corriger avant validation propre de la V1.

## Decisions validees

- V1.1 - correction "liste propre" publiee sur GitHub Pages et validee sur un nouveau dossier Test 2 : point de depart reference 1, creation de 3 depenses => prochaine reference 4, suppression de la depense du milieu => 2 depenses actives et prochaine reference 3.
- V1.1 - module Recettes publie sur GitHub Pages et valide sur une sauvegarde d'essai : onglet Recettes visible, creation d'une recette a 1 000 EUR OK, modification a 1 200 EUR OK, mise a jour du dashboard OK, suppression de la recette OK. Correctif du bug JavaScript "annual is not defined" publie et valide apres actualisation/cache navigateur.
- V1.1 - distinction definitive Calculatrice / Recettes : dans la calculatrice, le montant saisi est la commission agence globale TTC de la vente a simuler. Le logiciel applique ensuite la part personnelle, le bareme PP progressif, la TVA collectee, l'URSSAF et le net estime. Dans les recettes, le montant saisi est la commission conseiller TTC reellement facturee / encaissee. Les recettes "Commission immobiliere" servent d'historique reel pour recalculer automatiquement le cumul personnel HT avant une simulation.
- V1.1 - exemple calculatrice conserve : commission agence globale TTC 20 000 EUR, part personnelle 100 %, cumul personnel HT avant vente 0 EUR => commission conseiller TTC 14 000 EUR, TVA collectee 2 333,33 EUR, URSSAF 2 986,67 EUR, net estime 8 680 EUR. Formule confirmee : net estime = commission conseiller TTC - TVA collectee - URSSAF, soit commission conseiller HT - URSSAF.
- V1.1 - controles calculatrice avant ZIP : tests locaux OK, cas historiques Excel controles avec tolerance d'arrondi de 1 centime, franchissements de paliers 39 000 / 59 000 / 75 000 / 90 000 EUR HT controles, parts 50 % et 100 % controlees, coherence inverse entre recettes conseiller TTC et cumul personnel HT controlee sur une matrice de 100 simulations.
- V1.1 - test reel calculatrice publiee : apres deux recettes "Commission immobiliere" de 14 000 EUR TTC conseiller, cumul automatique environ 33 333,34 EUR HT. Simulation commission agence globale TTC 20 000 EUR, part 100 % : franchissement du palier 39 000 EUR valide, commission conseiller TTC 14 660 EUR, URSSAF 3 127,47 EUR, net estime 9 089,20 EUR.
- V1.1 - test reel calculatrice publiee avec part 50 % : meme cumul automatique environ 33 333,34 EUR HT. Simulation commission agence globale TTC 20 000 EUR, part 50 % : commission conseiller HT 5 966,67 EUR, commission conseiller TTC 7 160 EUR, URSSAF 1 527,47 EUR, net estime 4 439,20 EUR.
- V1.1 - bloc Calculatrice valide en test reel : simulation agence globale TTC, part 100 %, part 50 %, cumul automatique depuis recettes conseiller TTC, modification d'une recette, suppression d'une recette et retour du cumul a 0 OK.
- Tests uniquement avec des donnees fictives dans le dossier Test.
- Ne pas enregistrer de donnees definitives pendant la phase de test.
- La logique choisie pour les references est "liste propre", pas "reference comptable jamais reutilisee".
- Pour la V1.1, tester un nouveau visuel inspire du mockup Lucky Dinner joint par l'utilisateur : sidebar gauche, hero visuel en haut, cartes statistiques plus modernes, statistiques moins massives et bloc calculateur de commission a droite.
- Le changement visuel V1.1 ne doit pas casser la logique fonctionnelle deja validee en V1.
- Pour les prochaines versions, prevoir des compteurs dashboard TVA et URSSAF, comme dans l'ancienne version Excel : montants estimes a mettre de cote / a payer, calcules depuis les recettes et commissions validees.
- Ces compteurs TVA et URSSAF doivent etre des indicateurs de pilotage visibles sur le dashboard, pas seulement des resultats caches dans la calculatrice.
- Ancien dashboard Excel a reprendre comme reference fonctionnelle : recettes TTC, depenses TTC, tresorerie generee, tickets a retrouver.
- Reprendre la logique "Provisions du mois" : TVA nette, URSSAF + contributions, impot estimatif, avec provision generee, paye ce mois et variation nette.
- Reprendre la logique "Mes enveloppes virtuelles" : cumul jusqu'au mois consulte, avec TVA, URSSAF + contributions, impot sur le revenu, total, provision generee, deja paye et solde reserve.
- Prevoir des compteurs visibles : solde bancaire suivi et argent reellement libre.
- Prevoir un suivi mensuel : recettes, depenses et tresorerie par mois.
- Fichier Excel source fourni : "Tableau gestion financiere 2026 V7.xlsx". A utiliser comme reference de calcul pour V1.1.
- Parametres Excel releves : annee suivie 2026, TVA 20 %, cotisations BNC URSSAF 25,6 %, CFP 0,1 %, taxe CCI/CMA 0,05 %, provision impot estimative 10 %.
- Calcul saisie Excel : montant HT = montant TTC / (1 + TVA) si TVA applicable ou recette "Commission immobiliere"; TVA = TTC - HT; montant signe = +TTC pour recette et -TTC pour depense.
- Tickets a retrouver : compter les depenses de l'annee dont le justificatif est marque "Non".
- TVA nette mensuelle : TVA collectee des recettes du mois moins TVA deductible des depenses du mois, en excluant les categories de paiement de provision type TVA reversee, cotisations URSSAF, impot sur le revenu et impots/taxes.
- URSSAF mensuelle : total HT des recettes du mois x (BNC 25,6 % + CFP 0,1 % + taxe CCI/CMA 0,05 %).
- Impot estimatif mensuel : total HT des recettes du mois x 10 %.
- Tresorerie du mois apres provisions : tresorerie signee du mois moins variations nettes TVA, URSSAF et impot.
- Enveloppes cumulees : provision generee depuis le 1er janvier jusqu'au mois consulte, moins paiements deja enregistres, avec solde reserve minimum a 0.
- Argent reellement libre : solde bancaire suivi moins solde reserve total des enveloppes.
- Paliers commissions PP issus du fichier Excel : 70 % de 0 a 39 000 EUR HT, 75 % de 39 000 a 59 000 EUR HT, 80 % de 59 000 a 75 000 EUR HT, 85 % de 75 000 a 90 000 EUR HT, 90 % au-dela de 90 000 EUR HT.
- Collaboration : part personnelle 50 % par defaut en collaboration; le bareme progressif s'applique uniquement a la part personnelle et selon le cumul personnel.
- V1.1 - implementation dashboard TVA/URSSAF/argent libre : ajout de trois compteurs visibles. TVA nette a reserver = TVA collectee des recettes - TVA deductible des depenses - paiements de TVA deja saisis. URSSAF a reserver = recettes HT de l'annee x 25,75 % - paiements URSSAF deja saisis. Argent reellement libre = solde suivi - TVA nette a reserver - URSSAF a reserver. Les recettes "Commission immobiliere" sont converties automatiquement de TTC conseiller vers HT/TVA meme si la TVA saisie vaut 0.
- V1.1 - distinction de taux : calculatrice commission = URSSAF 25,6 % pour le net estime de simulation. Dashboard/enveloppes = URSSAF + contributions 25,75 % selon Excel (25,6 % BNC + 0,1 % CFP + 0,05 % taxe CCI/CMA).
- V1.1 - nouveau visuel : le visuel Lucky Dinner / Countach est integre comme image principale du dashboard. La version en cours reprend la structure du mockup fourni : barre laterale gauche sur PC, hero visuel en haut, cartes de statistiques, graphique principal et calculateur de commission directement visible sur le dashboard. Les ecrans Depenses, Recettes, Calculatrice et Reglages conservent la logique deja validee.
- V1.1 - audit calculs avant nouveau ZIP : controles automatises renforces sur depenses, recettes, modification, suppression, sauvegarde/restauration, calculatrice agence TTC, cumul automatique depuis recettes conseiller TTC, franchissement des paliers, TVA nette, URSSAF + contributions, paiements de provisions et arrondis. Incident detecte pendant l'audit : attendu de test corrige sur l'arrondi URSSAF d'une demi-part a 20 000 EUR agence TTC (1 493,34 EUR, pas 1 493,33 EUR). Le moteur de calcul etait correct.
- V1.1 - anomalie test reel 01/10/2026 : la categorie de depense "TVA reversee" n'est pas proposee dans la liste de categories. En saisie manuelle, l'utilisateur a tape "tva reverse" / "tva reversee" en minuscules ou sans accent, ce qui n'est pas reconnu par le moteur comme paiement de TVA. Effet constate : solde et depenses OK, mais TVA a reserver non diminuee de 1 000 EUR. Correction attendue : ajouter explicitement les categories de paiement "TVA reversee" et "Cotisations URSSAF" dans la liste, et normaliser les categories (minuscules, accents, variantes) pour les reconnaitre comme provisions payees.
- V1.1 - test reel provisions valide : apres correction manuelle exacte de la categorie "TVA reversee", la reserve TVA diminue correctement de 1 000 EUR et l'argent reellement libre reste stable. Apres saisie exacte de "Cotisations URSSAF", la reserve URSSAF diminue correctement de 500 EUR et l'argent reellement libre reste stable. Le moteur est OK avec categories exactes ; correction restante = ergonomie de saisie + normalisation robuste des variantes.
- V1.1 - correction preparee 02/10/2026 : ajout des categories "TVA reversee" et "Cotisations URSSAF" dans la liste de saisie des depenses. Ajout d'une normalisation des categories pour reconnaitre les variantes sans accent, en minuscules et les libelles proches comme "tva reverse", "TVA payee", "cotisations urssaf" et "paiement URSSAF". Tests locaux renforces : 9 blocs OK, dont un test dedie aux variantes de saisie TVA/URSSAF.

## Points a tester ensuite

### V1.2 validee et V1.3 preparee (02/10/2026)

- Thibaut confirme sur son PC : ajout, telechargement, retrait, restauration et conservation du ticket apres reouverture. Bloc V1.2 valide sur ce scenario.
- Anomalie ergonomique constatee : les cases "Retirer le ticket" et "Justificatif non requis" etaient au-dessus de leur texte, source de confusion. Correction V1.3 : case alignee a cote du texte, suppression des labels imbriques.
- V1.3 : rapprochement bancaire manuel, filtres mois/plage/entrees/sorties/pointees, date reelle bancaire, solde pointe incluant le point de depart, solde reel saisi et ecart.
- La comparaison utilise toutes les operations pointees jusqu'a la date choisie, meme si les filtres en masquent certaines. Les depenses historiques deja incluses dans le point de depart sont exclues.
- Cloture possible uniquement si l'ecart est nul et les operations saisies jusqu'a cette date sont pointees. Montants, dates et pointages d'une periode cloturee proteges ; reouverture de la derniere cloture possible. Modifier le montant ou la date d'une operation hors cloture annule son pointage pour la reverifier.
- Ouverture du dossier sur PC : affichage direct du tableau de rapprochement. Pointages et clotures inclus dans les sauvegardes existantes.
- Verification : 15 tests Node, plus simulation DOM de l'application complete. Test disque renforce sur sauvegarde/restauration et reouverture des pointages, clotures et justificatifs. Controle visuel navigateur reel toujours non disponible.
- Restent a integrer : animation/son de cloture configurable, detection des doublons, import bancaire et synchronisation mobile. Ne pas annoncer ces fonctions comme realisees.


### V1.2 - Justificatifs (02/10/2026)

- V1.1 : paiements TVA et URSSAF puis reouverture Test3 confirmes par Thibaut. Solde 13 580 EUR, reserve URSSAF 2 761,67 EUR, argent libre 10 305 EUR.
- Ajout d'un justificatif JPEG, PNG ou PDF par depense ; remplacement et retrait conserves dans une corbeille par depense, avec telechargement et restauration.
- Les tickets sont inclus dans le fichier JSON et toutes ses sauvegardes. Les anciens dossiers restent compatibles ; aucune modification des calculs comptables.
- Compteur des justificatifs manquants : depenses actives sans ticket, hors paiements TVA/URSSAF/impots et lignes marquees "Justificatif non requis". Une depense supprimee conserve ses pieces dans les donnees sauvegardees.
- Limites de cette premiere integration : 5 Mo par ticket et 20 Mo pour le fichier JSON complet, corbeille incluse. Ce stockage convient aux essais ; externaliser les pieces dans un dossier dedie avant un usage volumineux. Aucun OCR, detection de doublons ou synchronisation mobile ajoute dans ce bloc.
- Verification : 12 tests automatises passent (9 existants et 3 justificatifs), dont ecriture disque, sauvegarde, restauration et reouverture avec ticket. Controle visuel navigateur non realise : executable absent et telechargement bloque. Un essai reel d'ajout/telechargement reste necessaire.


- Plusieurs depenses sur une meme session.
- Categories de depenses si presentes.
- Affichage de l'historique complet.
- Statistiques apres plusieurs depenses.
- Sauvegarde apres plusieurs depenses.
- Restauration apres plusieurs depenses.
- Comportement apres fermeture puis reouverture du navigateur.


## V1.3 — validation utilisateur du rapprochement — 02/10/2026
- Test3 : six opérations pointées, solde initial 1 000 €, entrées 15 200 €, sorties 2 620 €, solde pointé 13 580 €, écart 0 €.
- Utilisateur confirme la clôture, puis la conservation des pointages et du verrouillage après actualisation et réouverture du dossier, puis la réouverture de la dernière clôture avec cases modifiables.
- Blocage temporaire initial des onglets et du sélecteur de dossier signalé sous Opera ; fonctionnement revenu sans correction identifiée. Console fournie : favicon 404 uniquement. Cause non établie, anomalie à surveiller ; ne pas déclarer corrigée.
- Ces contrôles valident le parcours de rapprochement essayé ; ils ne constituent pas une validation de toutes les exigences du logiciel.


## Règle permanente — autonomie — 02/10/2026
Après une validation utilisateur, passer directement au prochain test ou à la prochaine étape exécutable sans intervention de Thibaut. Ne pas attendre un nouveau « GO » pour poursuivre le travail déjà autorisé. Demander son intervention uniquement pour une manipulation sur son PC inaccessible ici, une information nécessaire ou une décision réellement non tranchée. Ne pas promettre de travailler en arrière-plan après avoir terminé une réponse.

## V1.3.1 — doublons potentiels
Alerte avant enregistrement pour même date, montant et libellé normalisé (casse, accents, espaces, ponctuation), dans le même type d'opération. Ignorer l'opération modifiée elle-même et les opérations annulées. Annuler la confirmation conserve le formulaire sans écriture ; confirmer permet une opération identique légitime. Catégorie et mode de paiement ne neutralisent pas l'alerte. Aucun effacement automatique.


## Retour utilisateur — analyse des captures et doublons — 02/10/2026
- Erreur d'assistance : la capture montrait « test reesto tva » (réf. 5) et « test resto tva » (réf. 1). La différence de libellé expliquait l'absence d'alerte ; elle aurait dû être repérée avant de proposer un changement de dossier ou de vérifier la version.
- Règle : examiner et comparer précisément date, montant, libellé et état affichés avant toute manipulation demandée. Ne pas conclure à un défaut de version tant que les données visibles expliquent le comportement.
- Utilisateur confirme avoir obtenu l'alerte avec le libellé identique : détection du doublon validée pour ce parcours. Une faute de frappe différente n'est actuellement pas détectée ; ne pas présenter la détection comme approximative.
- Nettoyage du test : annuler l'alerte ne crée aucune opération ; si l'utilisateur confirme l'enregistrement ou a déjà créé une ligne d'essai, supprimer seulement cette nouvelle ligne, en conservant l'originale.


## V1.3.2 — panneau de contrôles
- Après nettoyage utilisateur confirmé, poursuivre directement le développement autonome.
- Dashboard : lister les groupes de doublons potentiels déjà enregistrés, séparément pour dépenses et recettes ; même date, montant et libellé normalisé. Boutons d'examen ouvrant l'opération précise par identifiant interne.
- Lister les dépenses nécessitant un justificatif absent ; accès direct à la modification pour ajouter le ticket. Pas de suppression ni correction automatique.
- Apprentissage : ne pas identifier une opération à supprimer uniquement par une référence recalculée. Vérifier son libellé, date et montant sur la capture actuelle.

## V1.3.3 — Navigation et bilans
- Ordre validé : Dashboard, Dépenses, Recettes, Rapprochement, Calculatrice, Réglages & sauvegardes.
- Après validation, poursuivre immédiatement le travail autorisé ; ne pas attendre un nouveau GO.
- Bilan mensuel/annuel des saisies : recettes TTC, dépenses TTC, trésorerie générée. Historique et saisies futures de la période inclus ; solde initial exclu des flux.
- PDF via dialogue d’impression du navigateur : choisir Enregistrer en PDF. Aucun fichier comptable modifié.
- Les enveloppes fiscales et leur rattachement à la période de déclaration restent un module distinct ; ce bilan de flux ne vaut pas déclaration.

## Validation V1.3.3 et suite — 02/10/2026
- Thibaut confirme bilan mensuel/annuel et aperçu PDF dans Opera, après ouverture Test3.
- Suite exécutée sans nouveau GO : ajout au bilan du détail chronologique des recettes et dépenses (date, libellé, catégorie, TTC). Export PDF conserve ces lignes, sans modifier les comptes.

## V1.3.4 validée et V1.4 — dépenses récurrentes
- PDF réel reçu de Test3 : recettes 15 200 €, dépenses 2 620 €, trésorerie générée 12 580 €. Avec départ 1 000 €, solde suivi 13 580 €. Deux pages lisibles, toutes les opérations présentes.
- Récurrences mensuelles dans Réglages : libellé, catégorie, TTC, TVA, paiement, jour et premier mois ; modification, pause et réactivation.
- Préparer le virement personnel de 2 000 € ne crée aucune opération. TVA forcée à zéro ; sortie personnelle, sans déduction.
- Chaque échéance se crée sur confirmation explicite ; aucun prélèvement automatique ni pointage bancaire automatique. Jour absent ramené au dernier jour du mois.
- Prévention : même récurrence/mois jamais générée deux fois, même après suppression de la dépense. Dépense manuelle identique bloque la génération ; période clôturée protégée.
- Les échéances peuvent être créées pour un mois choisi à venir ; elles sont incluses dans le bilan des saisies et restent non pointées.
- Les anciens dossiers restent compatibles. Sauvegarde et restauration incluent les récurrences. Validation : 26 tests Node et parcours d’interface simulée. Essai réel du nouveau panneau à faire sur PC.

## V1.4.1 — Blocs repliables du Dashboard
- Décision utilisateur : Bilan, Dernières dépenses et Contrôles à examiner déployables au clic sur leur titre, réduits au deuxième clic, avec flèche.
- Boutons natifs accessibles au clavier, état aria-expanded et contenu associé ; chaque bloc indépendant, ouvert initialement. État conservé pendant les mises à jour dans la session.
- Tout voir reste indépendant de l’ouverture du bloc Dernières dépenses. L’impression PDF affiche le bilan intégral, même si son bloc est replié.
- Test V1.4 sur PC : dépense Test abonnement de 24 € au 15/10/2026 créée dans Test3, seconde génération bloquée confirmée ; ticket manquant attendu. Réouverture des récurrences non encore confirmée.

## V1.4.2 — Clarifier les récurrences
- Thibaut confirme les blocs repliables ; le virement personnel a été créé après repérage du second bouton.
- Anomalie ergonomique : confusion entre sauvegarder le modèle mensuel et créer sa dépense.
- Libellés : « Enregistrer le modèle » puis « Créer la dépense du JJ/MM/AAAA ». Message après sauvegarde indiquant explicitement la seconde étape.
- Le parcours simulé crée le virement personnel et vérifie TTC 2 000 €, TVA 0 €, justificatif non requis.

## V1.4.3 — Navigation simplifiée, décision du 02/10/2026
- Retirer du Dashboard Dernières dépenses et Bilan. Dépenses restent dans le menu existant.
- Bilan devient un onglet indépendant sous Calculatrice, avant Réglages & sauvegardes.
- Ordre définitif actuel : Dashboard, Dépenses, Recettes, Rapprochement, Calculatrice, Bilan, Réglages & sauvegardes.
- Contrôles à examiner reste repliable sur le Dashboard. Bilan affiche directement ses filtres et l’export PDF.

## V1.4.3 validée sur PC et audit V1.4.4 — 02/10/2026
- Thibaut confirme V1.4.3 validée sur son PC. Audit des échéances futures demandé et exécuté, auparavant seulement annoncé.
- Anomalie confirmée : solde du Dashboard limité à aujourd’hui, réserves TVA/URSSAF calculées sur toute l’année, saisies futures incluses. Le disponible était donc incohérent.
- V1.4.4 : calcul centralisé des indicateurs du Dashboard à la date locale du jour. Réserves TVA/URSSAF et solde suivent la même limite. Dépenses, recettes et paiements fiscaux futurs exclus ; date du jour incluse. Opérations annulées exclues même avec un fichier complet.
- Listes et bilan conservent les saisies futures conformément à la décision V1.3.3. Pas de migration des comptes ni de changement de taux ou de navigation.
- Vérification : 29 tests Node réussis, dont 3 nouveaux scénarios sur les limites de date, échéances récurrentes avec TVA, paiements TVA/URSSAF, virement personnel, recettes futures, année suivante, modification/annulation et conservation JSON. Tests existants de sauvegarde/restauration et rapprochement toujours réussis.
- Contrôle réel de V1.4.4 sur PC non effectué ici. ZIP préparé, pas de publication distante effectuée.

## V1.4.4 validée sur PC et V1.4.5 — accueil Dashboard — 02/10/2026
- Test3 : après ajout de « Test échéance future » du 15/10/2026 à 24 €, solde 13 580 €, TVA 513,33 €, URSSAF 2 761,67 €, disponible 10 305 € inchangés. Capture analysée ; ticket manquant supplémentaire attendu. TVA saisie non visible sur la capture.
- Thibaut confirme également la conservation après actualisation et réouverture.
- Nouvelle décision explicite : à l’ouverture du dossier, afficher le Dashboard. Cette décision remplace l’accueil Rapprochement prévu en V1.3. Elle vaut sur PC et mobile, également après actualisation puis réouverture du dossier.
- V1.4.5 : redirection vers Dashboard après ouverture réussie ; navigation manuelle vers Rapprochement conservée. Aucun changement des comptes ni des calculs.

## Validation PC V1.4.5 — 02/10/2026
- Thibaut confirme le parcours demandé : arrivée sur Dashboard après ouverture Test3, accès manuel au Rapprochement, retour au Dashboard après actualisation puis réouverture.
- Indicateurs de référence conservés : solde 13 580 €, TVA 513,33 €, URSSAF 2 761,67 €, disponible 10 305 €.
- Reste à confirmer pour la ligne manuelle « Test échéance future » du 15/10/2026 à 24 € : présence dans le bilan d’octobre, puis suppression de cette seule ligne d’essai. Ne pas supprimer la récurrence « Test abonnement » ni une autre opération.

## Fin du test dépense future — 02/10/2026
- Thibaut confirme présence de « Test échéance future » du 15/10/2026 à 24 € dans Bilan octobre, suppression de cette seule ligne, disponible conservé à 10 305 € et compteur tickets revenu à 1.
- Parcours PC dépense future terminé. Prochain contrôle ciblé : recette future « Autre recette » de 1 200 € TTC dont 200 € TVA, date 15/10/2026 ; les quatre indicateurs du jour doivent rester identiques. Ce prochain contrôle PC n’est pas encore effectué.

## Audit des opérations futures terminé — validation PC — 02/10/2026
- Thibaut confirme ajout de « Test recette future », Autre recette, 15/10/2026, 1 200 € TTC dont 200 € TVA : les quatre montants du Dashboard restent inchangés.
- Il confirme ensuite présence dans Bilan octobre et suppression de cette seule recette d’essai, sans variation des indicateurs du jour.
- Référence finale : solde 13 580 €, TVA 513,33 €, URSSAF 2 761,67 €, disponible 10 305 €.
- Audit demandé terminé : correction V1.4.4 vérifiée par 29 tests automatisés et parcours PC sur dépense et recette futures, bilan, nettoyage et réouverture. Accueil Dashboard V1.4.5 également validé sur PC.
- Aucun nouveau changement logiciel dans cette mise à jour du carnet. Inutile de réinstaller V1.4.5 pour ces notes.

## Clarification et confirmation du nettoyage recette — 02/10/2026
- Capture du bilan : dépenses revenues à 2 620 €, mais recette future de 1 200 € encore active dans Détail des recettes, total recettes 16 400 €. L’utilisateur parlait d’une suppression dans Dépenses ; aucune anomalie de calcul établie.
- Après indication de supprimer la ligne dans Recettes, Thibaut confirme : recettes octobre 15 200 €, dépenses 2 620 €, trésorerie générée 12 580 €.
- Clarification : seules les opérations futures actives figurent dans le bilan. Les opérations supprimées sont exclues des lignes et des totaux.
- Prochain point PC déjà prévu au carnet V1.4.1, non explicitement confirmé : conservation des modèles de récurrence après actualisation/réouverture. Contrôler dans Réglages sans générer de nouvelle échéance.

## Récurrences — validations PC complémentaires — 02/10/2026
- Première capture : dossier nommé « sauvegardes » ouvert, aucune récurrence. Ce constat ne prouve pas une perte dans Test3. Après sélection du dossier Test3, Thibaut confirme retrouver Test abonnement 24 € et Virement personnel 2 000 €.
- Conservation des deux modèles après réouverture validée pour ce parcours.
- Capture suivante : Test abonnement 24 € En pause et création d’échéance désactivée, bouton Réactiver présent. Thibaut confirme ensuite la réactivation sans création de dépense.
- Pause/réactivation validée. Aucun changement logiciel nécessaire pour ces contrôles.

## V1.4.6 — retour visuel de clôture — 02/10/2026
- Rappel utilisateur : poursuivre le travail déjà autorisé après validation ; ne pas s’arrêter à un compte rendu de tests.
- Prochain bloc prévu V1.3 : animation/son de clôture configurable. Partie visuelle intégrée : confettis cinq secondes après écriture réussie de closeBank. Case dans Rapprochement, préférence locale au navigateur conservée. Respect de réduction des animations et arrêt si page masquée ; aucun blocage des clics.
- Ni pointage, ni réouverture, ni lecture de dossier ne déclenchent l’effet. Échec disque : pas de confettis ; erreur visuelle : clôture réussie conservée, aucun nouvel enregistrement.
- 31 tests Node passent, dont deux nouveaux scénarios d’ordre d’exécution et de gestion des erreurs. Syntaxe JavaScript vérifiée. Essai visuel PC non réalisé ici.
- Son d’applaudissements Pixabay 237756 et option muet encore à intégrer ; cette version n’ajoute aucun son. Calculs et comptes inchangés.

## Incident publication V1.4.6 et correction V1.4.7 — 02/10/2026
- Capture : closure-feedback.mjs 404 et application non initialisée. Cause confirmée : nouveau module oublié dans la copie explicite du workflow .github/workflows/pages.yml. Erreur de préparation de l’assistant ; ZIP contenait bien le module, mais cela ne suffisait pas à le publier.
- V1.4.7 ajoute le module au workflow et vérifie les dépendances JS/HTML/CSS du dossier public avant publication (verify-public.mjs).
- 31 tests Node réussis ; préparation réelle du dossier public vérifiée. Suppression volontaire du module dans le dossier temporaire : contrôle refuse correctement la publication incomplète.
- Installation requiert aussi mise à jour de .github/workflows/pages.yml et ajout de verify-public.mjs. Pas de modification des comptes. Déploiement distant et animation PC encore à vérifier.

## V1.4.8 — récupération après 404 persistant — 02/10/2026
- Capture utilisateur : V1.4.7 visible mais closure-feedback.mjs toujours 404, tous les onglets bloqués par non-initialisation JavaScript. Ne pas attribuer ce décalage à une mauvaise manipulation sans vérifier le dépôt distant.
- Correctif autonome : intégrer le code des confettis dans reconciliation-ui.mjs, fichier déjà publié par le workflow historique. Retirer l’import et le module séparé. Fonctionnalité visuelle et option conservées.
- 31 tests réussis. Contrôle de toutes les dépendances dans un dossier public constitué avec la liste de l’ancien workflow : réussi. Aucun nouveau module nécessaire au démarrage.
- Publication et parcours PC à confirmer ; aucun changement des fichiers de comptes.

## Exigence renforcée avant ZIP et contrôles V1.4.8 — 02/10/2026
- Thibaut exige tous les tests possibles avant livraison du ZIP. Ne pas utiliser le test PC pour remplacer les contrôles locaux réalisables.
- 34 tests passent, avec trois scénarios d’interface DOM simulée sur clôture/animation cinq secondes, réouverture, option désactivée/préférence, erreur disque, écart non nul et réduction des animations.
- Préparation publique avec ancienne liste de fichiers réussie ; serveur HTTP local : tous les fichiers JS/HTML/CSS retournent 200 avec contenu exact et types MIME corrects. Pas d’import du module supprimé.
- Limite explicite : navigateur réel absent ; téléchargement Chromium tenté et échoué. Démarrage complet de l’application et clics sur tous les onglets dans Opera non vérifiés ici. Ne pas annoncer tous les contrôles navigateur comme réalisés.

## Validation PC V1.4.8 et suite audio — 02/10/2026
- Thibaut confirme démarrage rétabli puis clôture avec confettis. Il confirme aussi réouverture, clôture sans confettis lorsque l’option est décochée et réactivation de l’option.
- État final demandé : période laissée clôturée, confettis cochés.
- Suite exécutée : recherche et tentative d’accès au son Pixabay people-applause-237756. Page inaccessible par recherche web ; accès direct renvoie HTTP 403. Aucun MP3 obtenu, aucun substitut audio intégré.
- L’intégration du son exact nécessite le MP3 fourni par Thibaut. V1.4.8 reste fonctionnelle ; aucune nouvelle version logicielle créée tant que le son n’est pas obtenu et testé.

## V1.4.9 — son d’applaudissements intégré — 02/10/2026
- Thibaut fournit le MP3 exact scottishperson-sound-effect-crowd-applause-and-cheering-237756.mp3 et exige tous les tests disponibles avant remise du ZIP.
- Source contrôlée : MP3 256 kb/s, 44,1 kHz mono, 7,235906 s. Dérivé publié : assets/crowd-applause-and-cheering-237756-5s.mp3, 192 kb/s, 44,1 kHz mono, 5,041633 s, fondu final, 121 670 octets.
- À la clôture : préparation muette pendant l’écriture, retour au début et activation sonore après succès uniquement. Échec d’écriture : arrêt, remise à zéro et aucun son audible.
- Case « Son d’applaudissements » indépendante des confettis, préférence conservée dans le navigateur. Réduction des animations ne coupe pas le son si celui-ci reste coché.
- Contrôle de publication renforcé pour les chemins new Audio. MP3 manquant : préparation publique refusée. CSP media-src self.
- Contrôles source : 34 tests Node, syntaxes, décodage FFmpeg, dossier public et dépendances, HTTP 200, audio/mpeg ; contrôle négatif sans MP3 réussi. Le ZIP doit encore être testé après extraction avant livraison. Opera réel à confirmer par Thibaut.
- Contrôle final du paquet : ZIP extrait dans un dossier neuf, 39 fichiers intègres, empreinte du MP3 conforme, 34 tests relancés depuis l’extraction, syntaxes vérifiées, dossier public reconstruit, dépendances vérifiées et audio servi en HTTP 200 avec type audio/mpeg. ZIP prêt pour essai Opera.

## V2.0 — intégration du visuel validé — 02/10/2026
- Correction de référence : les deux images « Tableau de bord financier néon nocturne.png » et l’ancien mockup horizontal Lucky Dinner / Countach ne sont pas le visuel à intégrer.
- Visuel exact confirmé par Thibaut avec sa capture puis retrouvé dans l’ancienne conversation : « Tableau de bord néon aux accents turquoise.png », créé le 24/09/2026. Caractéristiques : logo rose dans la barre gauche, Bonjour Thibaut en cyan, Countach vue arrière au centre du bandeau, Lucky Dinner à droite, panneaux bleu nuit, accents cyan/rose/turquoise/jaune, graphique compact et calculatrice à droite.
- V2.0 applique cette identité au logiciel actuel. Les huit indicateurs fonctionnels restent affichés en deux rangées de quatre. Ordre des sept onglets conservé : Dashboard, Dépenses, Recettes, Rapprochement, Calculatrice, Bilan, Réglages & sauvegardes.
- Aucun changement des calculs, du stockage ou du format des comptes. Confettis et son V1.4.9 conservés.
- Contrôle final du paquet : ZIP extrait dans un dossier neuf, 41 fichiers intègres, 36 tests Node relancés, syntaxes vérifiées, structure HTML et identifiants contrôlés, dossier public reconstruit, empreintes image/son conformes, dépendances vérifiées, tests négatifs sans image et sans MP3 réussis, 10 fichiers publics servis en HTTP 200 avec contenu et types MIME exacts.
- Limite : le navigateur distant refuse les URL locales par politique de sécurité. Ne pas annoncer le rendu Opera comme vérifié avant l’essai réel de Thibaut.
