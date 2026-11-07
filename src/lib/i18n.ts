import { Profile } from './types';

export type LanguageCode = 'en' | 'fil' | 'es' | 'fr' | 'ar' | 'pt' | 'hi' | 'zh';

export const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fil', label: 'Filipino', flag: '🇵🇭' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export type TranslationKey =
  | 'nav.home' | 'nav.store' | 'nav.rentals' | 'nav.history' | 'nav.rewards' | 'nav.profile'
  | 'common.welcome' | 'common.about' | 'common.signOut'
  | 'dashboard.availableBalance' | 'dashboard.recharge' | 'dashboard.withdraw'
  | 'dashboard.withdrawalsAvailable' | 'dashboard.minWithdrawal'
  | 'dashboard.totalEarnings' | 'dashboard.activeRentals'
  | 'dashboard.featuredCars' | 'dashboard.recentTransactions' | 'dashboard.noTransactions'
  | 'dashboard.activeRentalsSection'
  | 'status.pending' | 'status.approved' | 'status.rejected' | 'status.active'
  | 'status.completed' | 'status.cancelled' | 'status.paused'
  | 'tx.recharge' | 'tx.withdrawal'
  | 'store.title' | 'store.dailyReturn' | 'store.from' | 'store.free'
  | 'rentals.title' | 'rentals.noRentals' | 'rentals.days' | 'rentals.perDay'
  | 'rewards.title' | 'rewards.checkin' | 'rewards.bubbleGame' | 'rewards.carbonPoints'
  | 'profile.title' | 'profile.fullName' | 'profile.email' | 'profile.phone'
  | 'profile.saveChanges' | 'profile.saving' | 'profile.saved'
  | 'profile.preferences' | 'profile.themeAccent' | 'profile.language'
  | 'profile.displayCurrency' | 'profile.notifSound' | 'profile.notifSoundDesc'
  | 'profile.soundEnabled' | 'profile.soundMuted' | 'profile.savePreferences'
  | 'profile.wallets' | 'profile.security' | 'profile.referral' | 'profile.history'
  | 'profile.memberSince' | 'profile.signOut'
  | 'profile.newPassword' | 'profile.confirmPassword' | 'profile.updatePassword'
  | 'profile.passwordUpdated' | 'profile.passwordMinLength' | 'profile.passwordsNoMatch'
  | 'referral.yourCode' | 'referral.shareDesc' | 'referral.copy' | 'referral.copied'
  | 'referral.howItWorks' | 'referral.step1' | 'referral.step2' | 'referral.step3' | 'referral.step4'
  | 'referral.vipRoadmap' | 'referral.vipDesc'
  | 'wallets.title' | 'wallets.desc' | 'wallets.add' | 'wallets.noWallets' | 'wallets.addFirst'
  | 'wallets.default' | 'wallets.method' | 'wallets.label' | 'wallets.accountName'
  | 'wallets.accountNumber' | 'wallets.walletAddress' | 'wallets.bankName'
  | 'wallets.setDefault' | 'wallets.saveWallet'
  | 'history.noHistory' | 'history.recharge' | 'history.withdrawal'
  | 'auth.signIn' | 'auth.signUp' | 'auth.email' | 'auth.password' | 'auth.fullName'
  | 'auth.phone' | 'auth.referralCode' | 'auth.welcomeBack' | 'auth.createAccount'
  | 'auth.haveAccount' | 'auth.noAccount' | 'auth.signingIn' | 'auth.signingUp'
  | 'chat.title' | 'chat.online' | 'chat.startConversation' | 'chat.replyInMinutes'
  | 'chat.typeMessage' | 'chat.aiAssistant'
  | 'common.error' | 'common.loading' | 'common.save' | 'common.cancel' | 'common.confirm'
  | 'common.delete' | 'common.edit' | 'common.close';

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  'nav.home': 'Home', 'nav.store': 'Car Store', 'nav.rentals': 'Rentals',
  'nav.history': 'History', 'nav.rewards': 'Rewards', 'nav.profile': 'Profile',
  'common.welcome': 'Welcome', 'common.about': 'About', 'common.signOut': 'Sign out',
  'dashboard.availableBalance': 'Available Balance', 'dashboard.recharge': 'Recharge',
  'dashboard.withdraw': 'Withdraw', 'dashboard.withdrawalsAvailable': 'Withdrawals available',
  'dashboard.minWithdrawal': 'Minimum withdrawal is ₱500.00',
  'dashboard.totalEarnings': 'Total Earnings', 'dashboard.activeRentals': 'Active Rentals',
  'dashboard.featuredCars': 'Featured Cars', 'dashboard.recentTransactions': 'Recent Transactions',
  'dashboard.noTransactions': 'No transactions yet', 'dashboard.activeRentalsSection': 'Active Rentals',
  'status.pending': 'Pending', 'status.approved': 'Approved', 'status.rejected': 'Rejected',
  'status.active': 'Active', 'status.completed': 'Completed', 'status.cancelled': 'Cancelled',
  'status.paused': 'Paused',
  'tx.recharge': 'Recharge', 'tx.withdrawal': 'Withdrawal',
  'store.title': 'Car Store', 'store.dailyReturn': '%/day', 'store.from': 'From', 'store.free': 'FREE',
  'rentals.title': 'My Rentals', 'rentals.noRentals': 'No rentals yet',
  'rentals.days': 'days', 'rentals.perDay': '/day',
  'rewards.title': 'Rewards', 'rewards.checkin': 'Daily Check-in',
  'rewards.bubbleGame': 'Bubble Game', 'rewards.carbonPoints': 'Carbon Points',
  'profile.title': 'Profile', 'profile.fullName': 'Full Name', 'profile.email': 'Email',
  'profile.phone': 'Phone', 'profile.saveChanges': 'Save Changes',
  'profile.saving': 'Saving...', 'profile.saved': 'Saved!',
  'profile.preferences': 'preferences', 'profile.themeAccent': 'Theme Accent',
  'profile.language': 'Language', 'profile.displayCurrency': 'Display Currency',
  'profile.notifSound': 'Notification Sound', 'profile.notifSoundDesc': 'Play a sound when in-app alerts appear',
  'profile.soundEnabled': 'Sound enabled', 'profile.soundMuted': 'Sound muted',
  'profile.savePreferences': 'Save Preferences',
  'profile.wallets': 'wallets', 'profile.security': 'security', 'profile.referral': 'referral',
  'profile.history': 'history', 'profile.memberSince': 'Member since', 'profile.signOut': 'Sign Out',
  'profile.newPassword': 'New Password', 'profile.confirmPassword': 'Confirm Password',
  'profile.updatePassword': 'Update Password', 'profile.passwordUpdated': 'Password updated successfully!',
  'profile.passwordMinLength': 'Password must be at least 6 characters',
  'profile.passwordsNoMatch': 'Passwords do not match',
  'referral.yourCode': 'Your Referral Code', 'referral.shareDesc': 'Share this code with friends. Every registered referral helps you unlock higher VIP levels.',
  'referral.copy': 'Copy', 'referral.copied': 'Copied!',
  'referral.howItWorks': 'How it works', 'referral.step1': 'Share your referral code with friends',
  'referral.step2': 'They enter the code when registering',
  'referral.step3': 'When they recharge, you earn 0.5% bonus automatically',
  'referral.step4': 'Bonuses are credited to your wallet in real time',
  'referral.vipRoadmap': 'VIP Referral Roadmap', 'referral.vipDesc': '3 referrals starts VIP 1 · 12 referrals reaches VIP 10',
  'wallets.title': 'Withdrawal Wallets', 'wallets.desc': 'Save your GCash, PayMaya, bank, or crypto addresses',
  'wallets.add': 'Add', 'wallets.noWallets': 'No wallets saved yet',
  'wallets.addFirst': 'Tap to add your first withdrawal wallet',
  'wallets.default': 'Default', 'wallets.method': 'Method', 'wallets.label': 'Label (optional)',
  'wallets.accountName': 'Account Name', 'wallets.accountNumber': 'Account Number',
  'wallets.walletAddress': 'Wallet Address', 'wallets.bankName': 'Bank Name',
  'wallets.setDefault': 'Set as default', 'wallets.saveWallet': 'Save Wallet',
  'history.noHistory': 'No transaction history yet',
  'history.recharge': 'Recharge', 'history.withdrawal': 'Withdrawal',
  'auth.signIn': 'Sign In', 'auth.signUp': 'Sign Up', 'auth.email': 'Email',
  'auth.password': 'Password', 'auth.fullName': 'Full Name', 'auth.phone': 'Phone',
  'auth.referralCode': 'Referral Code (optional)',
  'auth.welcomeBack': 'Welcome back', 'auth.createAccount': 'Create your account',
  'auth.haveAccount': 'Already have an account?', 'auth.noAccount': "Don't have an account?",
  'auth.signingIn': 'Signing in...', 'auth.signingUp': 'Signing up...',
  'chat.title': 'WAYMO Support', 'chat.online': 'Online',
  'chat.startConversation': 'Start a conversation with our support team',
  'chat.replyInMinutes': 'We typically reply within minutes',
  'chat.typeMessage': 'Type a message...', 'chat.aiAssistant': 'AI Assistant',
  'common.error': 'Error', 'common.loading': 'Loading...', 'common.save': 'Save',
  'common.cancel': 'Cancel', 'common.confirm': 'Confirm', 'common.delete': 'Delete',
  'common.edit': 'Edit', 'common.close': 'Close',
};

const fil: Translations = {
  'nav.home': 'Home', 'nav.store': 'Tindahan ng Kotse', 'nav.rentals': 'Mga Renta',
  'nav.history': 'Kasaysayan', 'nav.rewards': 'Gantimpala', 'nav.profile': 'Profile',
  'common.welcome': 'Maligayang pagdating', 'common.about': 'Tungkol', 'common.signOut': 'Mag-sign out',
  'dashboard.availableBalance': 'Magagamit na Balanse', 'dashboard.recharge': 'Mag-recharge',
  'dashboard.withdraw': 'Mag-withdraw', 'dashboard.withdrawalsAvailable': 'Available ang pag-withdraw',
  'dashboard.minWithdrawal': '₱500.00 ang pinakamababang pag-withdraw',
  'dashboard.totalEarnings': 'Kabuuang Kita', 'dashboard.activeRentals': 'Mga Aktibong Renta',
  'dashboard.featuredCars': 'Mga Kotse', 'dashboard.recentTransactions': 'Mga Kamakailang Transaksyon',
  'dashboard.noTransactions': 'Wala pang transaksyon', 'dashboard.activeRentalsSection': 'Mga Aktibong Renta',
  'status.pending': 'Nakabinbin', 'status.approved': 'Naaprubahan', 'status.rejected': 'Natanggihan',
  'status.active': 'Aktibo', 'status.completed': 'Tapos na', 'status.cancelled': 'Nakansela',
  'status.paused': 'Naka-pause',
  'tx.recharge': 'Recharge', 'tx.withdrawal': 'Withdrawal',
  'store.title': 'Tindahan ng Kotse', 'store.dailyReturn': '%/araw', 'store.from': 'Mula', 'store.free': 'LIBRE',
  'rentals.title': 'Aking Mga Renta', 'rentals.noRentals': 'Wala pang renta',
  'rentals.days': 'araw', 'rentals.perDay': '/araw',
  'rewards.title': 'Gantimpala', 'rewards.checkin': 'Pang-arawang Check-in',
  'rewards.bubbleGame': 'Laro ng Bubble', 'rewards.carbonPoints': 'Carbon Points',
  'profile.title': 'Profile', 'profile.fullName': 'Buong Pangalan', 'profile.email': 'Email',
  'profile.phone': 'Telepono', 'profile.saveChanges': 'I-save ang Pagbabago',
  'profile.saving': 'Nagsasave...', 'profile.saved': 'Nai-save na!',
  'profile.preferences': 'mga kagustuhan', 'profile.themeAccent': 'Temang Kulay',
  'profile.language': 'Wika', 'profile.displayCurrency': 'Paninghalang Currency',
  'profile.notifSound': 'Tunog ng Notipikasyon', 'profile.notifSoundDesc': 'Tugtugan ang tunog kapag may alerto',
  'profile.soundEnabled': 'Tunog naka-on', 'profile.soundMuted': 'Tunog naka-off',
  'profile.savePreferences': 'I-save ang Kagustuhan',
  'profile.wallets': 'mga wallet', 'profile.security': 'seguridad', 'profile.referral': 'referral',
  'profile.history': 'kasaysayan', 'profile.memberSince': 'Miyembro mula', 'profile.signOut': 'Mag-sign Out',
  'profile.newPassword': 'Bagong Password', 'profile.confirmPassword': 'Kumpirmahin ang Password',
  'profile.updatePassword': 'I-update ang Password', 'profile.passwordUpdated': 'Matagumpay na na-update ang password!',
  'profile.passwordMinLength': 'Hindi bababa sa 6 karakter ang password',
  'profile.passwordsNoMatch': 'Hindi tugma ang mga password',
  'referral.yourCode': 'Iyong Referral Code', 'referral.shareDesc': 'Ibahagi ang code na ito sa mga kaibigan. Ang bawang rehistradong referral ay tutulong sa iyo na ma-unlock ang mas mataas na VIP levels.',
  'referral.copy': 'Kopyahin', 'referral.copied': 'Nakopya na!',
  'referral.howItWorks': 'Paano ito gumagana', 'referral.step1': 'Ibahagi ang iyong referral code sa mga kaibigan',
  'referral.step2': 'Ilagay nila ang code kapag nagrehistro',
  'referral.step3': 'Kapag nag-recharge sila, kumita ka ng 0.5% bonus awtomatiko',
  'referral.step4': 'Ang mga bonus ay pupunta sa iyong wallet sa real time',
  'referral.vipRoadmap': 'VIP Referral Roadmap', 'referral.vipDesc': '3 referrals para sa VIP 1 · 12 referrals para sa VIP 10',
  'wallets.title': 'Mga Withdrawal Wallet', 'wallets.desc': 'I-save ang iyong GCash, PayMaya, bank, o crypto addresses',
  'wallets.add': 'Idagdag', 'wallets.noWallets': 'Wala pang wallet',
  'wallets.addFirst': 'I-tap para magdagdag ng iyong unang withdrawal wallet',
  'wallets.default': 'Default', 'wallets.method': 'Paraan', 'wallets.label': 'Label (opsyonal)',
  'wallets.accountName': 'Pangalan ng Account', 'wallets.accountNumber': 'Numero ng Account',
  'wallets.walletAddress': 'Wallet Address', 'wallets.bankName': 'Pangalan ng Bangko',
  'wallets.setDefault': 'Itakda bilang default', 'wallets.saveWallet': 'I-save ang Wallet',
  'history.noHistory': 'Wala pang kasaysayan ng transaksyon',
  'history.recharge': 'Recharge', 'history.withdrawal': 'Withdrawal',
  'auth.signIn': 'Mag-sign In', 'auth.signUp': 'Mag-sign Up', 'auth.email': 'Email',
  'auth.password': 'Password', 'auth.fullName': 'Buong Pangalan', 'auth.phone': 'Telepono',
  'auth.referralCode': 'Referral Code (opsyonal)',
  'auth.welcomeBack': 'Maligayang pagbalik', 'auth.createAccount': 'Gumawa ng account',
  'auth.haveAccount': 'Mayroon nang account?', 'auth.noAccount': 'Wala pang account?',
  'auth.signingIn': 'Nagsi-sign in...', 'auth.signingUp': 'Nagsi-sign up...',
  'chat.title': 'WAYMO Support', 'chat.online': 'Online',
  'chat.startConversation': 'Magsimula ng usapan sa aming support team',
  'chat.replyInMinutes': 'Karaniwang tumutugon kami sa loob ng ilang minuto',
  'chat.typeMessage': 'Mag-type ng mensahe...', 'chat.aiAssistant': 'AI Assistant',
  'common.error': 'Error', 'common.loading': 'Naglo-load...', 'common.save': 'I-save',
  'common.cancel': 'Kanselahin', 'common.confirm': 'Kumpirmahin', 'common.delete': 'Burahin',
  'common.edit': 'I-edit', 'common.close': 'Isara',
};

const es: Translations = {
  ...en,
  'nav.home': 'Inicio', 'nav.store': 'Tienda de Coches', 'nav.rentals': 'Alquileres',
  'nav.history': 'Historial', 'nav.rewards': 'Recompensas', 'nav.profile': 'Perfil',
  'common.welcome': 'Bienvenido', 'common.about': 'Acerca de', 'common.signOut': 'Cerrar sesión',
  'dashboard.availableBalance': 'Saldo Disponible', 'dashboard.recharge': 'Recargar',
  'dashboard.withdraw': 'Retirar', 'dashboard.withdrawalsAvailable': 'Retiros disponibles',
  'dashboard.minWithdrawal': 'El retiro mínimo es ₱500.00',
  'dashboard.totalEarnings': 'Ganancias Totales', 'dashboard.activeRentals': 'Alquileres Activos',
  'dashboard.featuredCars': 'Coches Destacados', 'dashboard.recentTransactions': 'Transacciones Recientes',
  'dashboard.noTransactions': 'Sin transacciones aún', 'dashboard.activeRentalsSection': 'Alquileres Activos',
  'status.pending': 'Pendiente', 'status.approved': 'Aprobado', 'status.rejected': 'Rechazado',
  'status.active': 'Activo', 'status.completed': 'Completado', 'status.cancelled': 'Cancelado',
  'status.paused': 'Pausado',
  'tx.recharge': 'Recarga', 'tx.withdrawal': 'Retiro',
  'store.title': 'Tienda de Coches', 'store.dailyReturn': '%/día', 'store.from': 'Desde', 'store.free': 'GRATIS',
  'rentals.title': 'Mis Alquileres', 'rentals.noRentals': 'Sin alquileres aún',
  'rentals.days': 'días', 'rentals.perDay': '/día',
  'rewards.title': 'Recompensas', 'rewards.checkin': 'Check-in Diario',
  'rewards.bubbleGame': 'Juego de Burbujas', 'rewards.carbonPoints': 'Puntos de Carbono',
  'profile.fullName': 'Nombre Completo', 'profile.phone': 'Teléfono',
  'profile.saveChanges': 'Guardar Cambios', 'profile.saving': 'Guardando...', 'profile.saved': '¡Guardado!',
  'profile.preferences': 'preferencias', 'profile.themeAccent': 'Color de Tema',
  'profile.language': 'Idioma', 'profile.displayCurrency': 'Moneda',
  'profile.notifSound': 'Sonido de Notificación', 'profile.notifSoundDesc': 'Reproducir sonido cuando aparezcan alertas',
  'profile.soundEnabled': 'Sonido activado', 'profile.soundMuted': 'Sonido silenciado',
  'profile.savePreferences': 'Guardar Preferencias',
  'profile.wallets': 'billeteras', 'profile.security': 'seguridad', 'profile.referral': 'referidos',
  'profile.history': 'historial', 'profile.memberSince': 'Miembro desde', 'profile.signOut': 'Cerrar Sesión',
  'profile.newPassword': 'Nueva Contraseña', 'profile.confirmPassword': 'Confirmar Contraseña',
  'profile.updatePassword': 'Actualizar Contraseña', 'profile.passwordUpdated': '¡Contraseña actualizada!',
  'profile.passwordMinLength': 'La contraseña debe tener al menos 6 caracteres',
  'profile.passwordsNoMatch': 'Las contraseñas no coinciden',
  'referral.yourCode': 'Tu Código de Referido', 'referral.copy': 'Copiar', 'referral.copied': '¡Copiado!',
  'referral.howItWorks': 'Cómo funciona', 'wallets.add': 'Añadir', 'wallets.title': 'Billeteras de Retiro',
  'wallets.noWallets': 'Sin billeteras guardadas', 'wallets.addFirst': 'Toca para añadir tu primera billetera',
  'wallets.method': 'Método', 'wallets.accountName': 'Nombre de Cuenta', 'wallets.accountNumber': 'Número de Cuenta',
  'wallets.saveWallet': 'Guardar Billetera', 'auth.signIn': 'Iniciar Sesión', 'auth.signUp': 'Registrarse',
  'auth.fullName': 'Nombre Completo', 'auth.phone': 'Teléfono',
  'auth.welcomeBack': 'Bienvenido de nuevo', 'auth.createAccount': 'Crea tu cuenta',
  'auth.haveAccount': '¿Ya tienes cuenta?', 'auth.noAccount': '¿No tienes cuenta?',
  'auth.signingIn': 'Iniciando sesión...', 'auth.signingUp': 'Registrándose...',
  'chat.typeMessage': 'Escribe un mensaje...', 'common.save': 'Guardar',
  'common.cancel': 'Cancelar', 'common.confirm': 'Confirmar', 'common.delete': 'Eliminar',
  'common.edit': 'Editar', 'common.close': 'Cerrar',
};

const fr: Translations = {
  ...en,
  'nav.home': 'Accueil', 'nav.store': 'Boutique de Voitures', 'nav.rentals': 'Locations',
  'nav.history': 'Historique', 'nav.rewards': 'Récompenses', 'nav.profile': 'Profil',
  'common.welcome': 'Bienvenue', 'common.about': 'À propos', 'common.signOut': 'Déconnexion',
  'dashboard.availableBalance': 'Solde Disponible', 'dashboard.recharge': 'Recharger',
  'dashboard.withdraw': 'Retirer', 'dashboard.withdrawalsAvailable': 'Retraits disponibles',
  'dashboard.minWithdrawal': 'Le retrait minimum est ₱500.00',
  'dashboard.totalEarnings': 'Gains Totaux', 'dashboard.activeRentals': 'Locations Actives',
  'dashboard.featuredCars': 'Voitures en Vedette', 'dashboard.recentTransactions': 'Transactions Récentes',
  'dashboard.noTransactions': 'Aucune transaction', 'dashboard.activeRentalsSection': 'Locations Actives',
  'status.pending': 'En attente', 'status.approved': 'Approuvé', 'status.rejected': 'Rejeté',
  'status.active': 'Actif', 'status.completed': 'Terminé', 'status.cancelled': 'Annulé',
  'status.paused': 'En pause',
  'tx.recharge': 'Recharge', 'tx.withdrawal': 'Retrait',
  'store.title': 'Boutique de Voitures', 'store.dailyReturn': '%/jour', 'store.from': 'À partir de', 'store.free': 'GRATUIT',
  'rentals.title': 'Mes Locations', 'rentals.noRentals': 'Aucune location',
  'rentals.days': 'jours', 'rentals.perDay': '/jour',
  'rewards.title': 'Récompenses', 'rewards.checkin': 'Check-in Quotidien',
  'rewards.bubbleGame': 'Jeu de Bulles', 'rewards.carbonPoints': 'Points Carbone',
  'profile.fullName': 'Nom Complet', 'profile.phone': 'Téléphone',
  'profile.saveChanges': 'Enregistrer', 'profile.saving': 'Enregistrement...', 'profile.saved': 'Enregistré!',
  'profile.preferences': 'préférences', 'profile.themeAccent': 'Couleur du Thème',
  'profile.language': 'Langue', 'profile.displayCurrency': 'Devise',
  'profile.notifSound': 'Son de Notification', 'profile.soundEnabled': 'Son activé', 'profile.soundMuted': 'Son coupé',
  'profile.savePreferences': 'Enregistrer les Préférences',
  'profile.wallets': 'portefeuilles', 'profile.security': 'sécurité', 'profile.referral': 'parrainage',
  'profile.history': 'historique', 'profile.memberSince': 'Membre depuis', 'profile.signOut': 'Déconnexion',
  'profile.newPassword': 'Nouveau Mot de Passe', 'profile.confirmPassword': 'Confirmer le Mot de Passe',
  'profile.updatePassword': 'Mettre à jour', 'profile.passwordUpdated': 'Mot de passe mis à jour!',
  'referral.yourCode': 'Votre Code de Parrainage', 'referral.copy': 'Copier', 'referral.copied': 'Copié!',
  'wallets.add': 'Ajouter', 'wallets.title': 'Portefeuilles de Retrait',
  'wallets.saveWallet': 'Enregistrer', 'auth.signIn': 'Connexion', 'auth.signUp': 'S\'inscrire',
  'auth.welcomeBack': 'Bon retour', 'auth.createAccount': 'Créez votre compte',
  'chat.typeMessage': 'Tapez un message...', 'common.save': 'Enregistrer',
  'common.cancel': 'Annuler', 'common.delete': 'Supprimer', 'common.edit': 'Modifier', 'common.close': 'Fermer',
};

const ar: Translations = {
  ...en,
  'nav.home': 'الرئيسية', 'nav.store': 'متجر السيارات', 'nav.rentals': 'الإيجارات',
  'nav.history': 'السجل', 'nav.rewards': 'المكافآت', 'nav.profile': 'الملف الشخصي',
  'common.welcome': 'مرحباً', 'common.about': 'حول', 'common.signOut': 'تسجيل الخروج',
  'dashboard.availableBalance': 'الرصيد المتاح', 'dashboard.recharge': 'إعادة شحن',
  'dashboard.withdraw': 'سحب', 'dashboard.withdrawalsAvailable': 'السحوبات متاحة',
  'dashboard.minWithdrawal': 'الحد الأدنى للسحب ₱500.00',
  'dashboard.totalEarnings': 'إجمالي الأرباح', 'dashboard.activeRentals': 'الإيجارات النشطة',
  'dashboard.featuredCars': 'سيارات مميزة', 'dashboard.recentTransactions': 'المعاملات الأخيرة',
  'dashboard.noTransactions': 'لا توجد معاملات', 'dashboard.activeRentalsSection': 'الإيجارات النشطة',
  'status.pending': 'قيد الانتظار', 'status.approved': 'موافق عليه', 'status.rejected': 'مرفوض',
  'status.active': 'نشط', 'status.completed': 'مكتمل', 'status.cancelled': 'ملغى', 'status.paused': 'متوقف',
  'tx.recharge': 'إعادة شحن', 'tx.withdrawal': 'سحب',
  'store.title': 'متجر السيارات', 'store.dailyReturn': '%/يوم', 'store.from': 'من', 'store.free': 'مجاني',
  'rentals.title': 'إيجاراتي', 'rentals.noRentals': 'لا توجد إيجارات',
  'rentals.days': 'أيام', 'rentals.perDay': '/يوم',
  'rewards.title': 'المكافآت', 'rewards.checkin': 'تسجيل دخول يومي',
  'rewards.bubbleGame': 'لعبة الفقاعات', 'rewards.carbonPoints': 'نقاط الكربون',
  'profile.fullName': 'الاسم الكامل', 'profile.phone': 'الهاتف',
  'profile.saveChanges': 'حفظ التغييرات', 'profile.saving': 'جار الحفظ...', 'profile.saved': 'تم الحفظ!',
  'profile.preferences': 'التفضيلات', 'profile.themeAccent': 'لون السمة',
  'profile.language': 'اللغة', 'profile.displayCurrency': 'العملة',
  'profile.notifSound': 'صوت الإشعارات', 'profile.soundEnabled': 'الصوت مفعّل', 'profile.soundMuted': 'الصوت مكتوم',
  'profile.savePreferences': 'حفظ التفضيلات',
  'profile.wallets': 'المحافظ', 'profile.security': 'الأمان', 'profile.referral': 'الإحالة',
  'profile.history': 'السجل', 'profile.memberSince': 'عضو منذ', 'profile.signOut': 'تسجيل الخروج',
  'profile.newPassword': 'كلمة مرور جديدة', 'profile.confirmPassword': 'تأكيد كلمة المرور',
  'profile.updatePassword': 'تحديث كلمة المرور', 'profile.passwordUpdated': 'تم تحديث كلمة المرور!',
  'referral.yourCode': 'رمز الإحالة الخاص بك', 'referral.copy': 'نسخ', 'referral.copied': 'تم النسخ!',
  'wallets.add': 'إضافة', 'wallets.title': 'محافظ السحب',
  'wallets.saveWallet': 'حفظ المحفظة', 'auth.signIn': 'تسجيل الدخول', 'auth.signUp': 'إنشاء حساب',
  'auth.welcomeBack': 'مرحباً بعودتك', 'auth.createAccount': 'أنشئ حسابك',
  'chat.typeMessage': 'اكتب رسالة...', 'common.save': 'حفظ',
  'common.cancel': 'إلغاء', 'common.delete': 'حذف', 'common.edit': 'تعديل', 'common.close': 'إغلاق',
};

const pt: Translations = {
  ...en,
  'nav.home': 'Início', 'nav.store': 'Loja de Carros', 'nav.rentals': 'Aluguéis',
  'nav.history': 'Histórico', 'nav.rewards': 'Recompensas', 'nav.profile': 'Perfil',
  'common.welcome': 'Bem-vindo', 'common.about': 'Sobre', 'common.signOut': 'Sair',
  'dashboard.availableBalance': 'Saldo Disponível', 'dashboard.recharge': 'Recarregar',
  'dashboard.withdraw': 'Sacar', 'dashboard.withdrawalsAvailable': 'Saques disponíveis',
  'dashboard.minWithdrawal': 'Saque mínimo de ₱500.00',
  'dashboard.totalEarnings': 'Ganhos Totais', 'dashboard.activeRentals': 'Aluguéis Ativos',
  'dashboard.featuredCars': 'Carros em Destaque', 'dashboard.recentTransactions': 'Transações Recentes',
  'dashboard.noTransactions': 'Sem transações', 'dashboard.activeRentalsSection': 'Aluguéis Ativos',
  'status.pending': 'Pendente', 'status.approved': 'Aprovado', 'status.rejected': 'Rejeitado',
  'status.active': 'Ativo', 'status.completed': 'Concluído', 'status.cancelled': 'Cancelado', 'status.paused': 'Pausado',
  'tx.recharge': 'Recarga', 'tx.withdrawal': 'Saque',
  'store.title': 'Loja de Carros', 'store.dailyReturn': '%/dia', 'store.from': 'Desde', 'store.free': 'GRÁTIS',
  'rentals.title': 'Meus Aluguéis', 'rentals.noRentals': 'Sem aluguéis',
  'rentals.days': 'dias', 'rentals.perDay': '/dia',
  'rewards.title': 'Recompensas', 'rewards.checkin': 'Check-in Diário',
  'profile.fullName': 'Nome Completo', 'profile.phone': 'Telefone',
  'profile.saveChanges': 'Salvar Alterações', 'profile.saving': 'Salvando...', 'profile.saved': 'Salvo!',
  'profile.preferences': 'preferências', 'profile.language': 'Idioma',
  'profile.savePreferences': 'Salvar Preferências',
  'profile.signOut': 'Sair', 'referral.yourCode': 'Seu Código de Indicação',
  'referral.copy': 'Copiar', 'referral.copied': 'Copiado!',
  'wallets.add': 'Adicionar', 'wallets.title': 'Carteiras de Saque',
  'wallets.saveWallet': 'Salvar Carteira', 'auth.signIn': 'Entrar', 'auth.signUp': 'Cadastrar',
  'auth.welcomeBack': 'Bem-vindo de volta', 'auth.createAccount': 'Crie sua conta',
  'chat.typeMessage': 'Digite uma mensagem...', 'common.save': 'Salvar',
  'common.cancel': 'Cancelar', 'common.delete': 'Excluir', 'common.edit': 'Editar', 'common.close': 'Fechar',
};

const hi: Translations = {
  ...en,
  'nav.home': 'होम', 'nav.store': 'कार स्टोर', 'nav.rentals': 'किराये',
  'nav.history': 'इतिहास', 'nav.rewards': 'पुरस्कार', 'nav.profile': 'प्रोफ़ाइल',
  'common.welcome': 'स्वागत है', 'common.about': 'परिचय', 'common.signOut': 'साइन आउट',
  'dashboard.availableBalance': 'उपलब्ध बैलेंस', 'dashboard.recharge': 'रिचार्ज',
  'dashboard.withdraw': 'निकासी', 'dashboard.withdrawalsAvailable': 'निकासी उपलब्ध',
  'dashboard.minWithdrawal': 'न्यूनतम निकासी ₱500.00',
  'dashboard.totalEarnings': 'कुल आय', 'dashboard.activeRentals': 'सक्रिय किराये',
  'dashboard.featuredCars': 'विशेष कारें', 'dashboard.recentTransactions': 'हाल के लेन-देन',
  'dashboard.noTransactions': 'अभी कोई लेन-देन नहीं', 'dashboard.activeRentalsSection': 'सक्रिय किराये',
  'status.pending': 'लंबित', 'status.approved': 'स्वीकृत', 'status.rejected': 'अस्वीकृत',
  'status.active': 'सक्रिय', 'status.completed': 'पूर्ण', 'status.cancelled': 'रद्द', 'status.paused': 'रुका हुआ',
  'tx.recharge': 'रिचार्ज', 'tx.withdrawal': 'निकासी',
  'store.title': 'कार स्टोर', 'store.dailyReturn': '%/दिन', 'store.from': 'से', 'store.free': 'मुफ़्त',
  'rentals.title': 'मेरे किराये', 'rentals.noRentals': 'कोई किराया नहीं',
  'rentals.days': 'दिन', 'rentals.perDay': '/दिन',
  'rewards.title': 'पुरस्कार', 'rewards.checkin': 'दैनिक चेक-इन',
  'profile.fullName': 'पूरा नाम', 'profile.phone': 'फ़ोन',
  'profile.saveChanges': 'बदलाव सहेजें', 'profile.saving': 'सहेज रहे हैं...', 'profile.saved': 'सहेजा गया!',
  'profile.preferences': 'प्राथमिकताएँ', 'profile.language': 'भाषा',
  'profile.savePreferences': 'प्राथमिकताएँ सहेजें',
  'profile.signOut': 'साइन आउट', 'referral.yourCode': 'आपका रेफरल कोड',
  'referral.copy': 'कॉपी', 'referral.copied': 'कॉपी हो गया!',
  'wallets.add': 'जोड़ें', 'wallets.title': 'निकासी वॉलेट',
  'wallets.saveWallet': 'वॉलेट सहेजें', 'auth.signIn': 'साइन इन', 'auth.signUp': 'साइन अप',
  'auth.welcomeBack': 'वापसी पर स्वागत है', 'auth.createAccount': 'अपना खाता बनाएं',
  'chat.typeMessage': 'संदेश टाइप करें...', 'common.save': 'सहेजें',
  'common.cancel': 'रद्द करें', 'common.delete': 'हटाएं', 'common.edit': 'संपादित करें', 'common.close': 'बंद करें',
};

const zh: Translations = {
  ...en,
  'nav.home': '首页', 'nav.store': '汽车商店', 'nav.rentals': '租赁',
  'nav.history': '历史', 'nav.rewards': '奖励', 'nav.profile': '个人资料',
  'common.welcome': '欢迎', 'common.about': '关于', 'common.signOut': '退出登录',
  'dashboard.availableBalance': '可用余额', 'dashboard.recharge': '充值',
  'dashboard.withdraw': '提现', 'dashboard.withdrawalsAvailable': '可提现',
  'dashboard.minWithdrawal': '最低提现 ₱500.00',
  'dashboard.totalEarnings': '总收入', 'dashboard.activeRentals': '活跃租赁',
  'dashboard.featuredCars': '精选汽车', 'dashboard.recentTransactions': '最近交易',
  'dashboard.noTransactions': '暂无交易', 'dashboard.activeRentalsSection': '活跃租赁',
  'status.pending': '待处理', 'status.approved': '已批准', 'status.rejected': '已拒绝',
  'status.active': '活跃', 'status.completed': '已完成', 'status.cancelled': '已取消', 'status.paused': '已暂停',
  'tx.recharge': '充值', 'tx.withdrawal': '提现',
  'store.title': '汽车商店', 'store.dailyReturn': '%/天', 'store.from': '起价', 'store.free': '免费',
  'rentals.title': '我的租赁', 'rentals.noRentals': '暂无租赁',
  'rentals.days': '天', 'rentals.perDay': '/天',
  'rewards.title': '奖励', 'rewards.checkin': '每日签到',
  'profile.fullName': '全名', 'profile.phone': '电话',
  'profile.saveChanges': '保存更改', 'profile.saving': '保存中...', 'profile.saved': '已保存!',
  'profile.preferences': '偏好设置', 'profile.language': '语言',
  'profile.savePreferences': '保存偏好',
  'profile.signOut': '退出登录', 'referral.yourCode': '您的推荐码',
  'referral.copy': '复制', 'referral.copied': '已复制!',
  'wallets.add': '添加', 'wallets.title': '提现钱包',
  'wallets.saveWallet': '保存钱包', 'auth.signIn': '登录', 'auth.signUp': '注册',
  'auth.welcomeBack': '欢迎回来', 'auth.createAccount': '创建您的账户',
  'chat.typeMessage': '输入消息...', 'common.save': '保存',
  'common.cancel': '取消', 'common.delete': '删除', 'common.edit': '编辑', 'common.close': '关闭',
};

const TRANSLATIONS: Record<LanguageCode, Translations> = { en, fil, es, fr, ar, pt, hi, zh };

export function translate(lang: LanguageCode, key: TranslationKey): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

export function isRTL(lang: LanguageCode): boolean {
  return lang === 'ar';
}

export function getLanguageFromProfile(profile: Profile | null): LanguageCode {
  if (profile?.language) return profile.language as LanguageCode;
  return 'en';
}
