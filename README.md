# Ordo Vitis

Application web de gestion du domaine viticole, publiée sur https://ordovitis.fr par l’intégration GitHub → Cloudflare.

## Organisation de l’interface

L’accueil illustré ouvre les espaces Vue d’ensemble, Vignoble, Cave, Commercial, Stocks, Administration et Wiki. Les fonctionnalités accessibles dépendent des droits du membre. Cave et Commercial sont des emplacements « À venir ».

La barre d’outils est en bas sur les fenêtres compactes et en haut sur les formats plus larges. La page Paramètres regroupe Mon compte, Sécurité, Apparence et Le domaine. Les changements d’adresse mail et de mot de passe y sont annoncés « À venir », sans nouveaux formulaires d’authentification.

## Fichiers et validation

- `index.html` contient les vues et la logique métier existantes, ainsi que l’intégration de navigation.
- `release.json` identifie la version, les ressources de navigation dans `assets/` et l’empreinte des scripts métier avant cette évolution.
- Les noms des nouvelles ressources incluent une empreinte de leur contenu pour éviter de servir un ancien script avec une nouvelle page.
- `manifest.json`, `pwa-icons/` et `service-worker.js` assurent l’installation et le cache de l’interface. Le service worker attend une action de mise à jour lorsqu’une version est déjà active.
- `node --test tests/*.test.cjs` vérifie les surfaces, traitements/stocks, l’intégration publiée et les ressources du cache. Ces tests ne constituent pas un audit complet de sécurité.

Cette version réutilise la connexion Supabase et ses politiques RLS existantes, sans migration. Aucune clé privilégiée n’est nécessaire dans le navigateur. Les configurations du test local, profils de navigateur et sessions de connexion ne doivent jamais être ajoutés au dépôt.

## Publication et retour à la version précédente

Une mise à jour de `main` déclenche la publication Cloudflare configurée pour ce dépôt. Avant chaque publication, vérifier les ressources, les parcours et les droits, mettre à jour les noms des ressources modifiées et la version du cache, puis contrôler le déploiement en ligne.

Le commit précédent la nouvelle organisation est `24d8f3e61264a48294206167645e89bae77b71ef`. En cas de retour arrière, préparer un commit de rétablissement des fichiers de ce commit ; aucune restauration de base n’est requise par cette livraison, qui ne modifie pas les données.
