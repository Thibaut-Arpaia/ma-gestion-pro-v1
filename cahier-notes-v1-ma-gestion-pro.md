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
