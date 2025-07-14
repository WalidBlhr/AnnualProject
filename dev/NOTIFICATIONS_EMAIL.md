# Système de Notifications avec Email - Quartissimo

## Vue d'ensemble

Le système de notifications de Quartissimo a été étendu pour inclure l'envoi automatique d'emails pour les notifications importantes. Les utilisateurs peuvent activer/désactiver les notifications par email dans leur profil.

## Types de Notifications

### 1. Trocs (`TROC`)
- **Nouveau troc créé** : Notifie tous les utilisateurs quand une nouvelle offre ou demande de troc est publiée
- **Statut de troc modifié** : Notifie le propriétaire du troc quand le statut change

### 2. Services (`SERVICE`)
- **Nouveau service disponible** : Notifie tous les utilisateurs quand un nouveau service est publié

### 3. Réservations (`BOOKING`) ⭐ **EMAIL**
- **Nouvelle réservation** : Notifie le prestataire quand son service est réservé
- **Réservation acceptée** : Notifie le demandeur quand sa réservation est acceptée
- **Réservation annulée** : Notifie la partie concernée quand une réservation est annulée

### 4. Événements (`EVENT`) ⭐ **EMAIL**
- **Nouvel événement** : Notifie tous les utilisateurs quand un nouvel événement est créé
- **Nouvelle participation** : Notifie le créateur quand quelqu'un s'inscrit à son événement
- **Événement annulé** : Notifie tous les participants quand un événement est annulé

### 5. Absences (`ABSENCE`) ⭐ **EMAIL**
- **Demande de surveillance** : Notifie les contacts de confiance sélectionnés
- **Réponse à la surveillance** : Notifie le propriétaire de la réponse (acceptée/refusée)

### 6. Général (`GENERAL`)
- **Message de bienvenue** : Envoyé lors de l'inscription
- **Nouveau contact de confiance** : Notifie quand on est ajouté comme contact de confiance

### 7. Messages (`MESSAGE`)
- **Messages normaux** : Messages directs entre utilisateurs

> ⭐ **EMAIL** = Ces notifications sont automatiquement envoyées par email si l'utilisateur a activé cette option dans ses préférences.

## Notifications par Email

### Configuration Email
Le système utilise **Nodemailer** pour l'envoi d'emails avec support pour :
- **Développement** : Ethereal Email (emails de test)
- **Production** : Services comme SendGrid, Mailgun, etc.

### Templates d'Email
Chaque type de notification importante a un template email dédié avec :
- **Design responsive** adapté mobile
- **Couleurs thématiques** par type de notification
- **Boutons d'action** pour rediriger vers l'application
- **Versions HTML et texte** pour compatibilité

### Préférences Utilisateur
Les utilisateurs peuvent gérer leurs préférences depuis `/profile` :
- **Switch activé/désactivé** pour les notifications email
- **Sauvegarde automatique** des préférences
- **Valeur par défaut** : notifications activées

## Architecture Technique

### Backend

#### Service Email (`/config/email.ts`)
```typescript
// Envoi d'email de notification
sendNotificationEmail(
  email: string, 
  type: string, 
  userName: string, 
  title: string, 
  content: string, 
  actionUrl?: string
)
```

#### NotificationService Étendu (`/utils/notificationService.ts`)
```typescript
interface NotificationData {
  // ...existing fields...
  sendEmail?: boolean;     // Forcer l'envoi d'email
  actionUrl?: string;      // URL d'action personnalisée
}
```

**Notifications importantes envoyées automatiquement par email :**
- Réservations (`booking`)
- Demandes de surveillance (`absence`)
- Événements annulés (`event`)

#### Nouveaux Endpoints
```
GET    /users/:id/email-notifications     # Lire les préférences
PUT    /users/:id/email-notifications     # Modifier les préférences
```

#### Modèle User Étendu
```sql
ALTER TABLE "user" 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;
```

### Frontend

#### Page Profile (`/pages/Profile/Profile.tsx`)
- **Section "Préférences de notification"**
- **Switch MUI** pour activer/désactiver les emails
- **Feedback utilisateur** avec Snackbar
- **Chargement async** des préférences

#### Interface Utilisateur
```tsx
<FormControlLabel
  control={
    <Switch 
      checked={emailNotificationsEnabled}
      onChange={handleEmailNotificationToggle}
    />
  }
  label="Notifications par email"
/>
```

## Configuration

### Variables d'Environnement
```env
# Email
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
FROM_EMAIL=noreply@quartissimo.com

# Frontend URL pour les liens d'action
FRONTEND_URL=http://localhost:3000
```

### Types de Notifications Importantes
Modifiables dans `NotificationService.isImportantNotification()` :
```typescript
const importantTypes = ['booking', 'absence', 'event'];
```

## Utilisation

### Envoi d'une Notification avec Email
```typescript
await NotificationService.sendNotification({
  type: 'booking',
  title: 'Nouvelle réservation',
  content: 'Votre service a été réservé...',
  receiverId: userId,
  senderId: requesterId,
  sendEmail: true  // Force l'envoi d'email
});
```

### Gestion des Préférences (Frontend)
```typescript
// Charger les préférences
const response = await axios.get(`/users/${userId}/email-notifications`);

// Mettre à jour les préférences
await axios.put(`/users/${userId}/email-notifications`, { 
  enabled: true 
});
```

## Test et Debug

### Script de Test
```bash
npx ts-node src/scripts/test-email-notifications.ts
```

### Logs de Debug
- Envoi de notification : Console backend
- Préférences utilisateur : Console frontend
- Emails envoyés : Nodemailer logs

### Preview des Emails
En développement, les URLs de preview Ethereal sont affichées dans la console.

## Améliorations Futures

1. **Templates personnalisables** par l'admin
2. **Fréquence d'envoi** (immédiat, digest quotidien/hebdomadaire)
3. **Types de notifications sélectionnables** individuellement
4. **Notifications push** navigateur
5. **SMS** pour les urgences
6. **Multi-langue** pour les templates
7. **Statistiques d'ouverture** des emails
