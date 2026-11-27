# Modèles .glb importés

Dépose ici un `.glb` par type de moustique, puis déclare-le dans `manifest.json` :

```json
{ "mosquito": { "file": "moustique.glb", "size": 1.2, "yaw": 0, "lift": 0 } }
```

- Types : mosquito, speedbug, heavy, swarmling, spitter, kamikaze, shield, splitter, healer, tyrant.
- `file` : nom simple en `.glb` (pas de chemin). `size` : plus grande dimension (1.2 par défaut). `yaw` : rotation en radians si le modèle ne regarde pas vers +Z. `lift` : le monte ou le baisse.
- Le jeu applique tout seul le rendu « Gomme & Encre » (matériau toon + contour d'encre) en gardant la texture. Un clip d'animation nommé fly / hover / idle est joué en boucle (sinon le premier).
- Visé : ~5 000 faces par modèle. Fichier absent ou cassé = le moustique procédural est utilisé à la place.
- Nécessite `vendor/addons/loaders/GLTFLoader.js` et `vendor/addons/utils/SkeletonUtils.js`.
