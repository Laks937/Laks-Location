# 🚗 Laks - Application de Location de Véhicules

**Laks** est une application mobile (iOS et Android) permettant de louer facilement des véhicules citadins et de luxe. Elle intègre un système de paiement sécurisé via Stripe pour gérer les prises d'acompte lors de la réservation.

---

## 📱 Fonctionnalités

* **Catalogue double :** Véhicules économiques (citadines) et premium (luxe).
* **Réservation simple :** Choix des dates via un calendrier intuitif.
* **Paiement sécurisé :** Intégration de Stripe pour le paiement par carte.
* **Système d'acompte :** Le client paie seulement un acompte pour bloquer le véhicule, le reste est réglé plus tard.

---

## 🛠️ Installation rapide

**1. Cloner le projet**

```bash
git clone https://github.com/votre-nom/laks-app.git
cd laks-app

```

**2. Installer les dépendances**

```bash
npm install

```

**3. Configurer Stripe**
Créez un fichier `.env` à la racine du projet et ajoutez vos clés API Stripe :

```env
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle
STRIPE_SECRET_KEY=sk_test_votre_cle

```

**4. Lancer l'application**

```bash
npm start

```

---

## 💳 Comment fonctionne l'acompte (Stripe) ?

L'application utilise Stripe PaymentIntents. Au moment de valider sa location, le client ne paie qu'un pourcentage du prix total (l'acompte). Ce paiement valide instantanément la réservation dans la base de données.