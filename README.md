# Assistant peinture Marine Corail

Application web statique, tactile et sans dépendances pour guider le choix d’un antifouling, d’une peinture ou d’une résine, puis estimer la quantité et les conditionnements à vendre.

## État du catalogue

L’interface est fonctionnelle, mais les produits inclus dans `catalogue.js` sont des **données de démonstration**. Ils permettent de tester le moteur de recommandation et les calculs sans présenter de faux prix. Avant une utilisation en magasin, Marine Corail doit fournir les données réelles décrites ci-dessous.

### Pour chaque produit

- Famille : antifouling, peinture, primaire, vernis, résine, gelcoat ou enduit.
- Marque, nom commercial, référence interne/SKU et éventuellement EAN.
- Conditionnements réellement vendus et prix TTC en F CFP pour chaque conditionnement.
- État : actif, arrêté, sur commande ou indisponible.
- Fiche technique PDF et fiche de données de sécurité.
- Rendement pratique, nombre de couches, diluant, méthode d’application et temps de séchage.
- Supports compatibles : polyester/gelcoat, bois, acier, aluminium, plomb, bronze, inox, etc.
- Pour un antifouling : type de matrice, vitesse maximale et compatibilité avec les eaux tropicales en immersion permanente.
- Pour une peinture : zones d’usage, mono/bi-composant, finition et sous-couche requise.
- Pour une résine : usage, densité, ratio base/durcisseur, consommation, épaisseur par passe et ratio résine/renfort conseillé.

Les références et prix peuvent être fournis dans un tableur ou un export de caisse. Les fiches techniques peuvent être déposées en PDF, même en vrac : elles seront rapprochées des références lors de l’intégration.

## Lancer localement

L’application ne nécessite aucune compilation. Le service worker a besoin d’un serveur HTTP local :

```powershell
python -m http.server 8080
```

Puis ouvrir `http://localhost:8080` dans Chrome ou Edge.

## Publier avec GitHub Pages

1. Envoyer les fichiers sur la branche `main` du dépôt GitHub.
2. Dans **Settings → Pages**, choisir **Deploy from a branch**.
3. Sélectionner la branche `main` et le dossier `/ (root)`.
4. Ouvrir l’URL fournie par GitHub Pages sur la tablette.
5. Dans Chrome Android, choisir **Ajouter à l’écran d’accueil** pour un usage plein écran et hors ligne.

## Architecture

- `index.html` : structure de la page et en-tête.
- `styles.css` : mise en page tactile, paysage/portrait et impression.
- `app.js` : parcours guidé, compatibilités, calculs et optimisation des pots.
- `catalogue.js` : produits, références, conditionnements et prix — seul fichier métier à remplacer.
- `manifest.webmanifest` et `sw.js` : installation sur tablette et cache hors ligne.

## Principes de calcul

- Antifouling : surface immergée estimée selon le type de carène, puis `surface × couches ÷ rendement`, avec marge chantier réglable.
- Pont : `longueur hors tout × largeur × 0,75`.
- Franc-bord : `(longueur hors tout + largeur) × hauteur moyenne × 2`.
- Stratification : poids total du renfort × ratio de résine, avec marge chantier.
- Revêtement résine : surface × couches × consommation par couche.
- Coulée : volume géométrique × densité du produit.

Une mesure réelle ou une surface fournie par le constructeur reste prioritaire. Le résultat ne remplace jamais la fiche technique, l’étiquette ou l’avis d’un conseiller pour un ancien système inconnu.
