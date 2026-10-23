// Store admin in Arabic (default, right-to-left) and French: dashboard, orders, products, categories
// and settings. Talks to /api/admin/*. Pages are addressed by the URL hash (#dashboard, #orders,
// #order-12…) so links and the back button work. The chosen language is remembered in localStorage.
(() => {
  const app = document.getElementById('app');

  const I18N = {
    ar: {
      locale: 'ar-MA',
      status: { new: 'جديد', confirmed: 'مؤكد', shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغى', returned: 'مرتجع' },
      nav: { dashboard: 'لوحة التحكم', orders: 'الطلبات', products: 'المنتجات', categories: 'الأصناف', settings: 'الإعدادات' },
      navShort: { dashboard: 'الرئيسية' },
      viewStore: 'عرض المتجر',
      logout: 'تسجيل الخروج',
      sellerSpace: 'فضاء البائع',
      loginHint: 'سجّل الدخول لإدارة طلباتك.',
      password: 'كلمة السر',
      signIn: 'دخول',
      switchTo: 'Français',
      errors: {
        wrong_password: 'كلمة السر غير صحيحة.',
        locked: 'محاولات كثيرة خاطئة. تم إيقاف الدخول من هذا الجهاز مؤقتًا، حاول لاحقًا.',
        bad_origin: 'طلب مرفوض.',
        slug_taken: 'هذا الرابط (slug) مستعمل من قبل.',
        name_required: 'أضف اسمًا واحدًا على الأقل.',
        price_required: 'حدّد الثمن.',
        not_enough_stock: 'المخزون غير كافٍ لإعادة فتح هذا الطلب.',
        bad_shipping_rates: 'أثمنة التوصيل حسب المدينة: صيغة غير صحيحة.',
        no_r2: 'تخزين الصور (R2) غير مفعّل.',
        too_large: 'الصورة كبيرة جدًا (5 ميغا كحد أقصى).',
        bad_type: 'صيغة الصورة غير مدعومة.',
        no_email_key: 'مفتاح Brevo غير مثبت بعد (انظر الخطوات أسفله).',
        no_email_from: 'أدخل عنوان الإرسال (المؤكد في Brevo).',
        no_notify_email: 'أدخل العنوان الذي يستقبل التنبيهات.',
        email_failed: 'رفض Brevo الإرسال.',
        generic: 'خطأ',
      },
      ago: { now: 'الآن', min: (n) => `منذ ${n} د`, hour: (n) => `منذ ${n} س`, day: (n) => `منذ ${n} ي` },
      hello: ['صباح الخير', 'مساء الخير', 'مساء الخير'],
      pending: (n) => `${n} ${n > 1 ? 'طلبات' : 'طلب'} في انتظار التأكيد.`,
      pendingHint: 'اتصل بالزبون أو راسله على واتساب قبل الإرسال.',
      sales30: 'المبيعات · 30 يومًا',
      orders30: 'الطلبات · 30 يومًا',
      today: 'اليوم',
      aov: 'متوسط السلة',
      excludingCancelled: 'بدون الملغاة',
      collected30: 'المحصّل · 30 يومًا',
      deliveredOrders: 'الطلبات المسلّمة',
      deliveredRate: (n) => `${n}% سُلّمت من الطلبات المغلقة`,
      isNew: 'جديد',
      salesPerDay: 'المبيعات اليومية',
      last30dh: 'آخر 30 يومًا، بالدرهم',
      days30: '30 يومًا',
      salesChartLabel: 'المبيعات اليومية خلال 30 يومًا',
      ordersN: (n) => `${n} ${n === 1 ? 'طلب' : 'طلبات'}`,
      pipeline: 'تتبع الطلبات',
      noOrdersMonth: 'لا توجد طلبات هذا الشهر بعد.',
      cities: 'المدن',
      ordersShort30: 'الطلبات، 30 يومًا',
      nothingYet: 'لا شيء للعرض حاليًا.',
      bestSellers: 'الأكثر مبيعًا',
      bestSellersEmpty: 'ستظهر هنا منتجاتك الأكثر مبيعًا.',
      latestOrders: 'آخر الطلبات',
      seeAll: 'عرض الكل',
      noOrdersYet: 'لا توجد طلبات بعد. شارك رابط متجرك!',
      lowStock: 'مخزون منخفض',
      left: (n) => `${n} متبقية`,
      soldOut: 'نفد',
      emails: 'الرسائل التلقائية',
      emailsOn: 'مفعّلة',
      emailsOff: 'غير مفعّلة',
      emailsOnText: (to) => `تأكيد للزبون وتنبيه إلى <strong>${to}</strong> عند كل طلب.`,
      emailsOffText: 'أرسل تأكيدًا لزبائنك وتوصّل بتنبيه عند كل طلب.',
      emailSettings: 'إعدادات الرسائل',
      setUp: 'الإعداد في 5 دقائق',
      exportCsv: 'تصدير CSV',
      total: (n) => `${n} في المجموع`,
      all: 'الكل',
      searchOrders: 'رقم، اسم، هاتف، مدينة',
      thOrder: 'الطلب', thCustomer: 'الزبون', thCity: 'المدينة', thTotal: 'المجموع', thStatus: 'الحالة',
      noMatch: 'لا توجد طلبات مطابقة.',
      orderAt: 'طلب',
      language: 'اللغة',
      phone: 'الهاتف', email: 'البريد', city: 'المدينة', address: 'العنوان', note: 'ملاحظة',
      call: 'اتصال',
      delivery: 'التوصيل', free: 'مجاني', toCollect: 'المبلغ المستحق',
      adminNote: 'ملاحظة داخلية', adminNoteHint: 'لا يراها إلا أنت',
      changeStatus: 'تغيير الحالة',
      statusEmailHint: 'يتوصل الزبون برسالة عندما يصبح الطلب مؤكدًا، تم شحنه، تم توصيله أو ملغى.',
      updated: 'تم تحديث الطلب',
      updatedEmailed: 'تم تحديث الطلب · أُرسلت رسالة للزبون',
      noteSaved: 'تم حفظ الملاحظة',
      close: 'إغلاق',
      thProduct: 'المنتج', thCategory: 'الصنف', thPrice: 'الثمن', thStock: 'المخزون', thState: 'الحالة',
      home: '★ الرئيسية', online: 'معروض', hidden: 'مخفي',
      noProducts: 'لا توجد منتجات. أضف أول منتج.',
      nProducts: (n) => `${n} ${n === 1 ? 'منتج' : 'منتجات'}`,
      add: 'إضافة',
      editProduct: 'تعديل المنتج', newProduct: 'منتج جديد',
      name: 'الاسم', priceStock: 'الثمن والمخزون',
      price: 'الثمن (درهم)', comparePrice: 'الثمن القديم (مشطوب، اختياري)', stock: 'المخزون (فارغ = غير محدود)', category: 'الصنف',
      options: 'الخيارات (المقاسات، الألوان…) مفصولة بفواصل',
      photos: 'الصور', addPhotos: 'اختيار صور', takePhoto: 'التقاط صورة',
      dropHere: 'اسحب الصور هنا أو اخترها من جهازك', dropHint: 'JPG، PNG، WEBP… تُصغَّر تلقائيًا قبل الرفع. الصورة الأولى هي الرئيسية.',
      mainPhoto: 'رئيسية', moveBefore: 'تقديم', moveAfter: 'تأخير', pasteLinks: 'أو الصق روابط صور',
      uploadFailed: (n) => `تعذّر رفع ${n}`, notImage: (n) => `${n} ليس صورة مدعومة`, waitUploads: 'انتظر حتى ينتهي رفع الصور.',
      photoLinks: 'روابط الصور (رابط في كل سطر)', remove: 'حذف',
      description: 'الوصف', display: 'العرض',
      slug: 'رابط الصفحة (slug)', auto: 'تلقائي', sort: 'ترتيب العرض',
      featured: 'إبرازه في الصفحة الرئيسية', active: 'معروض (ظاهر في المتجر)',
      cancel: 'إلغاء', view: 'عرض', del: 'حذف', save: 'حفظ',
      confirmDeleteProduct: 'حذف هذا المنتج؟ الطلبات السابقة تبقى محفوظة.',
      productDeleted: 'تم حذف المنتج', productSaved: 'تم حفظ المنتج',
      uploading: (n) => `جارٍ رفع ${n}…`,
      catsSub: 'أقسام متجرك',
      thPhoto: 'الصورة', thPhotoLink: 'رابط الصورة', thSort: 'الترتيب', thProducts: 'المنتجات',
      newCategory: 'صنف جديد', ok: 'حفظ',
      catSaved: 'تم حفظ الصنف',
      confirmDeleteCat: 'حذف هذا الصنف؟ تبقى منتجاته معروضة بدون صنف.',
      store: 'المتجر', storeName: 'اسم المتجر', whatsapp: 'رقم واتساب (مثال 212612345678)', contactEmail: 'بريد التواصل (الزبائن يردّون عليه)',
      emailsIntro: 'عند كل طلب، يتوصل الزبون بتأكيد بلغته (إذا أدخل بريده) وتتوصل أنت بتنبيه. ويُخبَر الزبون أيضًا عندما يصبح طلبه مؤكدًا، تم شحنه، تم توصيله أو ملغى.',
      keyOk: 'مفتاح Brevo مثبت', keyMissing: 'مفتاح Brevo غير مثبت',
      emailFrom: 'عنوان الإرسال (مؤكد في Brevo)', notifyEmail: 'استقبال تنبيهات الطلبات على',
      statusUpdates: 'إخبار الزبون عند كل تغيير في الحالة',
      weakPassword: 'كلمة سر الإدارة قصيرة. استعمل 12 حرفًا على الأقل (npx wrangler secret put ADMIN_PASSWORD).',
      social: 'مواقع التواصل',
      socialHint: 'الصق رابط الصفحة أو اسم الحساب فقط (مثلا @shophani). تظهر الأيقونات أسفل المتجر.',
      pixels: 'بيكسل الإعلانات',
      pixelsHint: 'الصق رقم البيكسل فقط، وليس الكود كاملًا. لا يُحمَّل أي بيكسل إلا بعد موافقة الزائر على ملفات الارتباط.',
      metaPixel: 'رقم Meta Pixel (فيسبوك وإنستغرام)',
      metaHow: 'فيسبوك: Meta Events Manager ← مصادر البيانات ← اختر البيكسل ← الرقم (Dataset ID) من 15 أو 16 رقمًا.',
      tiktokPixel: 'رقم TikTok Pixel',
      tiktokHow: 'تيك توك: TikTok Ads Manager ← Tools ← Events ← Web Events ← البيكسل ← الرقم (مثل C4ABC…).',
      legal: 'معلومات الشركة (للصفحات القانونية)',
      legalHint: 'تظهر في صفحتي «سياسة الخصوصية» و«شروط البيع». النصوص نسخة أولية، يُستحسن مراجعتها من طرف محاسب أو مختص قانوني.',
      legalName: 'الاسم القانوني (شركة أو مقاول ذاتي)',
      legalIce: 'رقم ICE',
      legalRc: 'السجل التجاري (RC) أو رقم المقاول الذاتي',
      legalAddress: 'العنوان',
      legalCndp: 'رقم التصريح لدى CNDP (إن وُجد)',
      viewPages: 'عرض الصفحات:',
      legalPrivacy: 'سياسة الخصوصية',
      legalTerms: 'شروط البيع',
      sendTest: 'إرسال رسالة تجريبية', howItWorks: 'كيف يعمل؟',
      steps: [
        'أنشئ حسابًا مجانيًا على <a href="https://www.brevo.com" target="_blank" rel="noopener">brevo.com</a> (300 رسالة في اليوم مجانًا).',
        'في Brevo، افتح <em>Senders, domains &amp; dedicated IPs</em> وأضف عنوان الإرسال (مثلًا بريد Gmail). اضغط على رابط التأكيد الذي يصلك.',
        'في Brevo، افتح <em>SMTP &amp; API → API keys</em> وأنشئ مفتاحًا. لا تشاركه مع أحد.',
        'على حاسوبك، في مجلد المتجر، شغّل <code>npx wrangler secret put BREVO_API_KEY</code> والصق المفتاح عندما يُطلب منك.',
        'أدخل العنوان المؤكد أسفله، احفظ، ثم اضغط «إرسال رسالة تجريبية».',
      ],
      shipping: 'التوصيل', shippingFee: 'ثمن التوصيل الافتراضي (درهم)', freeOver: 'توصيل مجاني ابتداءً من (درهم، 0 = أبدًا)',
      rates: 'أثمنة حسب المدينة (سطر لكل مدينة: المدينة = الثمن)',
      banner: 'شريط الإعلان', bannerHint: 'الرسالة التي تمر أعلى كل صفحة.',
      homePage: 'الصفحة الرئيسية', homeHint: 'اتركه فارغًا للاحتفاظ بالنص الافتراضي.',
      heroTitle: 'العنوان', heroText: 'النص',
      saveSettings: 'حفظ الإعدادات', settingsSaved: 'تم حفظ الإعدادات',
      testSent: (to) => `أُرسلت الرسالة التجريبية إلى ${to}`,
      fr: 'الفرنسية', ar: 'العربية', en: 'الإنجليزية',
    },
    fr: {
      locale: 'fr-MA',
      status: { new: 'Nouvelle', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', returned: 'Retournée' },
      nav: { dashboard: 'Tableau de bord', orders: 'Commandes', products: 'Produits', categories: 'Catégories', settings: 'Réglages' },
      navShort: { dashboard: 'Accueil' },
      viewStore: 'Voir la boutique',
      logout: 'Déconnexion',
      sellerSpace: 'Espace vendeur',
      loginHint: 'Connectez-vous pour gérer vos commandes.',
      password: 'Mot de passe',
      signIn: 'Se connecter',
      switchTo: 'العربية',
      errors: {
        wrong_password: 'Mot de passe incorrect.',
        locked: 'Trop d’essais ratés. La connexion depuis cet appareil est bloquée un moment, réessayez plus tard.',
        bad_origin: 'Requête refusée.',
        slug_taken: 'Cette adresse (slug) est déjà utilisée.',
        name_required: 'Ajoutez au moins un nom.',
        price_required: 'Indiquez un prix.',
        not_enough_stock: 'Stock insuffisant pour rouvrir cette commande.',
        bad_shipping_rates: 'Tarifs par ville : format invalide.',
        no_r2: 'Le stockage des photos (R2) n’est pas configuré.',
        too_large: 'Photo trop lourde (5 Mo max).',
        bad_type: 'Format de photo non pris en charge.',
        no_email_key: 'La clé Brevo n’est pas encore installée (voir les étapes ci-dessous).',
        no_email_from: 'Indiquez l’adresse d’envoi (vérifiée dans Brevo).',
        no_notify_email: 'Indiquez l’adresse qui reçoit les alertes.',
        email_failed: 'Brevo a refusé l’envoi.',
        generic: 'Erreur',
      },
      ago: { now: 'à l’instant', min: (n) => `il y a ${n} min`, hour: (n) => `il y a ${n} h`, day: (n) => `il y a ${n} j` },
      hello: ['Bonjour', 'Bon après-midi', 'Bonsoir'],
      pending: (n) => `${n} commande${n > 1 ? 's' : ''} à confirmer.`,
      pendingHint: 'Appelez ou écrivez sur WhatsApp avant d’expédier.',
      sales30: 'Ventes · 30 jours',
      orders30: 'Commandes · 30 j',
      today: 'Aujourd’hui',
      aov: 'Panier moyen',
      excludingCancelled: 'hors annulées',
      collected30: 'Encaissé · 30 j',
      deliveredOrders: 'commandes livrées',
      deliveredRate: (n) => `${n} % livrées sur les clôturées`,
      isNew: 'Nouveau',
      salesPerDay: 'Ventes par jour',
      last30dh: '30 derniers jours, en DH',
      days30: '30 jours',
      salesChartLabel: 'Ventes par jour sur 30 jours',
      ordersN: (n) => `${n} commande${n > 1 ? 's' : ''}`,
      pipeline: 'Suivi des commandes',
      noOrdersMonth: 'Pas encore de commandes ce mois-ci.',
      cities: 'Villes',
      ordersShort30: 'commandes, 30 j',
      nothingYet: 'Rien à afficher pour l’instant.',
      bestSellers: 'Meilleures ventes',
      bestSellersEmpty: 'Vos produits les plus vendus apparaîtront ici.',
      latestOrders: 'Dernières commandes',
      seeAll: 'Tout voir',
      noOrdersYet: 'Aucune commande pour l’instant. Partagez le lien de votre boutique !',
      lowStock: 'Stock bas',
      left: (n) => `${n} restant${n > 1 ? 's' : ''}`,
      soldOut: 'Épuisé',
      emails: 'E-mails automatiques',
      emailsOn: 'Actifs',
      emailsOff: 'À configurer',
      emailsOnText: (to) => `Confirmation au client et alerte à <strong>${to}</strong> pour chaque commande.`,
      emailsOffText: 'Envoyez une confirmation à vos clients et recevez une alerte à chaque commande.',
      emailSettings: 'Réglages des e-mails',
      setUp: 'Configurer en 5 minutes',
      exportCsv: 'Export CSV',
      total: (n) => `${n} au total`,
      all: 'Toutes',
      searchOrders: 'N°, nom, téléphone, ville',
      thOrder: 'Commande', thCustomer: 'Client', thCity: 'Ville', thTotal: 'Total', thStatus: 'Statut',
      noMatch: 'Aucune commande ne correspond.',
      orderAt: 'Commande',
      language: 'Langue',
      phone: 'Téléphone', email: 'E-mail', city: 'Ville', address: 'Adresse', note: 'Remarque',
      call: 'Appeler',
      delivery: 'Livraison', free: 'Gratuite', toCollect: 'À encaisser',
      adminNote: 'Note interne', adminNoteHint: 'Visible uniquement par vous',
      changeStatus: 'Changer le statut',
      statusEmailHint: 'Le client reçoit un e-mail quand la commande passe à Confirmée, Expédiée, Livrée ou Annulée.',
      updated: 'Commande mise à jour',
      updatedEmailed: 'Commande mise à jour · e-mail envoyé au client',
      noteSaved: 'Note enregistrée',
      close: 'Fermer',
      thProduct: 'Produit', thCategory: 'Catégorie', thPrice: 'Prix', thStock: 'Stock', thState: 'État',
      home: '★ Accueil', online: 'En ligne', hidden: 'Masqué',
      noProducts: 'Aucun produit. Ajoutez le premier.',
      nProducts: (n) => `${n} produit${n > 1 ? 's' : ''}`,
      add: 'Ajouter',
      editProduct: 'Modifier le produit', newProduct: 'Nouveau produit',
      name: 'Nom', priceStock: 'Prix et stock',
      price: 'Prix (DH)', comparePrice: 'Ancien prix (barré, facultatif)', stock: 'Stock (vide = illimité)', category: 'Catégorie',
      options: 'Options (tailles, couleurs…) séparées par des virgules',
      photos: 'Photos', addPhotos: 'Choisir des photos', takePhoto: 'Prendre une photo',
      dropHere: 'Glissez vos photos ici ou choisissez-les sur votre appareil', dropHint: 'JPG, PNG, WEBP… réduites automatiquement avant l’envoi. La première photo est la photo principale.',
      mainPhoto: 'Principale', moveBefore: 'Avancer', moveAfter: 'Reculer', pasteLinks: 'Ou collez des liens d’images',
      uploadFailed: (n) => `Échec de l’envoi de ${n}`, notImage: (n) => `${n} n’est pas une image prise en charge`, waitUploads: 'Attendez la fin de l’envoi des photos.',
      photoLinks: 'Liens des photos (un par ligne)', remove: 'Retirer',
      description: 'Description', display: 'Affichage',
      slug: 'Adresse de la page (slug)', auto: 'automatique', sort: 'Ordre d’affichage',
      featured: 'Mettre en avant sur l’accueil', active: 'En ligne (visible dans la boutique)',
      cancel: 'Annuler', view: 'Voir', del: 'Supprimer', save: 'Enregistrer',
      confirmDeleteProduct: 'Supprimer ce produit ? Les anciennes commandes sont conservées.',
      productDeleted: 'Produit supprimé', productSaved: 'Produit enregistré',
      uploading: (n) => `Envoi de ${n}…`,
      catsSub: 'Les rayons de votre boutique',
      thPhoto: 'Photo', thPhotoLink: 'Lien de la photo', thSort: 'Ordre', thProducts: 'Produits',
      newCategory: 'Nouvelle catégorie', ok: 'OK',
      catSaved: 'Catégorie enregistrée',
      confirmDeleteCat: 'Supprimer cette catégorie ? Ses produits restent en ligne, sans catégorie.',
      store: 'Boutique', storeName: 'Nom de la boutique', whatsapp: 'Numéro WhatsApp (ex. 212612345678)', contactEmail: 'E-mail de contact (les clients y répondent)',
      emailsIntro: 'À chaque commande, le client reçoit une confirmation dans sa langue (s’il a donné son e-mail) et vous recevez une alerte. Le client est aussi prévenu quand sa commande est confirmée, expédiée, livrée ou annulée.',
      keyOk: 'Clé Brevo installée', keyMissing: 'Clé Brevo manquante',
      emailFrom: 'Adresse d’envoi (vérifiée dans Brevo)', notifyEmail: 'Recevoir les alertes de commande sur',
      statusUpdates: 'Prévenir le client à chaque changement de statut',
      weakPassword: 'Le mot de passe admin est court. Utilisez au moins 12 caractères (npx wrangler secret put ADMIN_PASSWORD).',
      social: 'Réseaux sociaux',
      socialHint: 'Collez le lien de la page ou juste le nom du compte (ex. @shophani). Les icônes s’affichent en bas de la boutique.',
      pixels: 'Pixels publicitaires',
      pixelsHint: 'Collez seulement l’identifiant, pas le code complet. Aucun pixel n’est chargé tant que le visiteur n’a pas accepté les cookies.',
      metaPixel: 'ID Meta Pixel (Facebook et Instagram)',
      metaHow: 'Facebook : Meta Events Manager → Sources de données → votre pixel → l’ID (Dataset ID) de 15 ou 16 chiffres.',
      tiktokPixel: 'ID TikTok Pixel',
      tiktokHow: 'TikTok : TikTok Ads Manager → Tools → Events → Web Events → votre pixel → l’ID (ex. C4ABC…).',
      legal: 'Informations légales',
      legalHint: 'Affichées dans la politique de confidentialité et les conditions de vente. Ces textes sont un projet : faites-les relire par un comptable ou un juriste.',
      legalName: 'Raison sociale ou nom (auto-entrepreneur)',
      legalIce: 'ICE',
      legalRc: 'RC ou n° auto-entrepreneur',
      legalAddress: 'Adresse',
      legalCndp: 'N° de déclaration CNDP (si disponible)',
      viewPages: 'Voir les pages :',
      legalPrivacy: 'Confidentialité',
      legalTerms: 'Conditions de vente',
      sendTest: 'Envoyer un test', howItWorks: 'Comment ça marche ?',
      steps: [
        'Créez un compte gratuit sur <a href="https://www.brevo.com" target="_blank" rel="noopener">brevo.com</a> (300 e-mails par jour offerts).',
        'Dans Brevo, ouvrez <em>Expéditeurs, domaines et IP dédiées</em> et ajoutez votre adresse d’envoi (par ex. votre Gmail). Cliquez sur le lien de vérification reçu.',
        'Dans Brevo, ouvrez <em>SMTP et API → Clés API</em> et créez une clé. Ne la partagez avec personne.',
        'Sur votre PC, dans le dossier de la boutique, lancez <code>npx wrangler secret put BREVO_API_KEY</code> et collez la clé quand on vous la demande.',
        'Indiquez ci-dessous l’adresse vérifiée, enregistrez, puis cliquez sur « Envoyer un test ».',
      ],
      shipping: 'Livraison', shippingFee: 'Frais de livraison par défaut (DH)', freeOver: 'Livraison gratuite à partir de (DH, 0 = jamais)',
      rates: 'Tarifs par ville (une ligne par ville : Ville = prix)',
      banner: 'Bandeau d’annonce', bannerHint: 'Le message qui défile en haut de chaque page.',
      homePage: 'Accueil', homeHint: 'Laissez vide pour garder le texte par défaut.',
      heroTitle: 'Titre', heroText: 'Sous-titre',
      saveSettings: 'Enregistrer les réglages', settingsSaved: 'Réglages enregistrés',
      testSent: (to) => `E-mail de test envoyé à ${to}`,
      fr: 'Français', ar: 'العربية', en: 'English',
    },
  };

  const savedLang = (() => {
    try {
      return localStorage.getItem('admin.lang');
    } catch {
      return null;
    }
  })();
  let lang = 'ar';
  let L = I18N.ar;
  function setLang(next) {
    lang = I18N[next] ? next : 'ar';
    L = I18N[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = `Shop Hani · ${L.sellerSpace}`;
    try {
      localStorage.setItem('admin.lang', lang);
    } catch {}
  }
  setLang(savedLang);

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const num = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const dh = (n) => (lang === 'ar' ? `${num(n)} درهم` : `${num(n)} DH`);
  const date = (s) => new Date(`${s.replace(' ', 'T')}Z`);
  const when = (s) => date(s).toLocaleString(L.locale, { dateStyle: 'short', timeStyle: 'short', numberingSystem: 'latn' });
  const ago = (s) => {
    const min = Math.round((Date.now() - date(s)) / 60000);
    if (min < 1) return L.ago.now;
    if (min < 60) return L.ago.min(min);
    if (min < 1440) return L.ago.hour(Math.round(min / 60));
    return L.ago.day(Math.round(min / 1440));
  };
  const STATUS_KEYS = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  const PAGES = ['dashboard', 'orders', 'products', 'categories', 'settings'];
  const LANG_LABEL = { ar: 'العربية', fr: 'Français', en: 'English' };
  const dirOf = (l) => (l === 'ar' ? 'dir="rtl" lang="ar"' : `dir="ltr" lang="${l}"`);
  // Translations are entered with the admin's own language first.
  const contentLangs = () => (lang === 'ar' ? ['ar', 'fr', 'en'] : ['fr', 'ar', 'en']);
  let state = { page: 'dashboard', status: '', q: '', images: false, emails: false, settings: {}, categories: [] };

  // Line icons, 24×24, stroke = currentColor.
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    orders: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    products: '<path d="m21 8-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    categories: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',
    chevron: '<path d="m15 6-6 6 6 6"/>',
  };
  const icon = (n, s = 20) => `<svg class="i i-${n}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

  let toastTimer;
  function toast(text, bad) {
    const el = document.querySelector('.toast');
    el.textContent = text;
    el.className = `toast${bad ? ' bad' : ''}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3000);
  }

  async function api(path, { method = 'GET', body, raw } = {}) {
    const res = await fetch(`/api/admin${path}`, {
      method,
      headers: raw ? { 'content-type': raw.type } : body ? { 'content-type': 'application/json' } : {},
      body: raw || (body ? JSON.stringify(body) : undefined),
      credentials: 'same-origin',
    });
    if (res.status === 401 && path !== '/login') {
      login();
      throw new Error('unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = L.errors[data.error] || data.error || `${L.errors.generic} ${res.status}`;
      throw new Error(data.error === 'email_failed' && data.detail ? `${msg} ${data.detail}` : msg);
    }
    return data;
  }

  const other = () => (lang === 'ar' ? 'fr' : 'ar');
  const langButton = (cls = '') => `<button type="button" class="lang-switch ${cls}" data-lang="${other()}" lang="${other()}">${icon('globe', 18)}<span>${L.switchTo}</span></button>`;

  // Login
  function login() {
    document.body.className = 'is-login';
    app.innerHTML = `<form class="login" id="login">
      <div class="login-top"><img src="/admin/logo.svg" alt="Shop Hani" class="login-logo">${langButton()}</div>
      <h1>${L.sellerSpace}</h1>
      <p class="muted">${L.loginHint}</p>
      <label>${L.password}<input type="password" name="password" autocomplete="current-password" required autofocus dir="ltr"></label>
      <button class="btn btn-lg">${L.signIn}</button>
      <p class="error" hidden></p>
    </form>`;
    const f = document.getElementById('login');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/login', { method: 'POST', body: { password: f.password.value } });
        start();
      } catch (err) {
        const p = f.querySelector('.error');
        p.textContent = err.message;
        p.hidden = false;
      }
    });
  }

  function shell(title, content, { actions = '', sub = '' } = {}) {
    document.body.className = '';
    const nav = PAGES.map(
      (k) =>
        `<a href="#${k}" class="nav-item${state.page === k ? ' on' : ''}">${icon(k)}<span class="long">${L.nav[k]}</span><span class="short">${L.navShort[k] || L.nav[k]}</span>${k === 'orders' && state.pending ? `<b class="nav-badge">${state.pending}</b>` : ''}</a>`,
    ).join('');
    app.innerHTML = `<aside class="side">
        <a href="#dashboard" class="side-logo"><img src="/admin/logo-dark.svg" alt="${esc(state.settings.store_name || 'Shop Hani')}"></a>
        <nav class="side-nav">${nav}</nav>
        <div class="side-foot">
          <button class="nav-item" data-lang="${other()}" lang="${other()}">${icon('globe')}<span>${L.switchTo}</span></button>
          <a href="/${lang}/" target="_blank" rel="noopener" class="nav-item">${icon('external')}<span>${L.viewStore}</span></a>
          <button class="nav-item" data-logout>${icon('logout')}<span>${L.logout}</span></button>
        </div>
      </aside>
      <div class="page">
        <header class="page-head"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="head-actions">${langButton('mobile-only')}${actions}</div></header>
        <main class="page-body">${content}</main>
      </div>
      <nav class="tabbar">${nav}</nav>`;
  }

  document.addEventListener('click', async (e) => {
    const sw = e.target.closest('[data-lang]');
    if (sw) {
      setLang(sw.dataset.lang);
      if (document.body.classList.contains('is-login')) login();
      else route();
      return;
    }
    if (e.target.closest('[data-logout]')) {
      await api('/logout', { method: 'POST', body: {} });
      login();
    }
  });
  window.addEventListener('hashchange', route);

  async function start() {
    try {
      const me = await api('/me');
      state.images = me.images;
      state.emails = me.emails;
      state.settings = (await api('/settings')).settings;
      state.categories = (await api('/categories')).categories;
      route();
      if (me.weak_password) toast(L.weakPassword, true);
    } catch (err) {
      if (err.message !== 'unauthorized') app.innerHTML = `<p class="error pad">${esc(err.message)}</p>`;
    }
  }

  function route() {
    const h = location.hash.slice(1) || 'dashboard';
    const m = h.match(/^order-(\d+)$/);
    if (m) {
      if (state.page !== 'orders' || !app.querySelector('[data-order]')) {
        state.page = 'orders';
        orders().then(() => orderDetail(m[1]));
      } else orderDetail(m[1]);
      return;
    }
    state.page = PAGES.includes(h) ? h : 'dashboard';
    ({ dashboard, orders, products, categories, settings })[state.page]();
    window.scrollTo(0, 0);
  }

  const loading = (title) => shell(title, '<div class="skeleton-grid"><div></div><div></div><div></div><div></div></div>');
  const catName = (c) => (lang === 'ar' ? c.name_ar || c.name_fr : c.name_fr || c.name_ar) || '—';
  const prodName = (p) => (lang === 'ar' ? p.name_ar || p.name_fr || p.name_en : p.name_fr || p.name_ar || p.name_en);

  // Dashboard
  function trend(now, prev) {
    if (!prev) return now ? `<span class="trend up">${L.isNew}</span>` : '';
    const pct = Math.round(((now - prev) / prev) * 100);
    return `<span class="trend ${pct >= 0 ? 'up' : 'down'}" dir="ltr">${icon(pct >= 0 ? 'up' : 'down', 14)}${Math.abs(pct)} %</span>`;
  }

  // Sales per day for the last 30 days: one series, bars with a hover tooltip. Time always runs left to right.
  function salesChart(daily) {
    const byDay = Object.fromEntries(daily.map((d) => [d.d, d]));
    const days = [];
    const today = new Date(Date.now() + 3600e3);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today - i * 864e5).toISOString().slice(0, 10);
      days.push({ d, sales: byDay[d]?.sales || 0, orders: byDay[d]?.orders || 0 });
    }
    const max = Math.max(...days.map((d) => d.sales), 1);
    const p10 = 10 ** Math.floor(Math.log10(max));
    const nice = [1, 2, 2.5, 5, 10].map((k) => k * p10).find((v) => v >= max);
    const W = 720, H = 220, Lm = 52, B = 26, T = 10;
    const bw = (W - Lm) / days.length;
    const y = (v) => T + (H - T - B) * (1 - v / nice);
    const grid = [0, 0.5, 1].map((f) => `<line x1="${Lm}" x2="${W}" y1="${y(nice * f)}" y2="${y(nice * f)}" class="grid"/><text x="${Lm - 8}" y="${y(nice * f) + 4}" class="axis" text-anchor="end">${num(nice * f)}</text>`).join('');
    const bars = days
      .map((d, i) => {
        const x = Lm + i * bw;
        const h = Math.max(d.sales ? 3 : 0, H - B - y(d.sales));
        const label = new Date(`${d.d}T12:00:00Z`).toLocaleDateString(L.locale, { day: 'numeric', month: 'short', numberingSystem: 'latn' });
        return `<g class="bar" data-tip="${esc(label)} · ${dh(d.sales)} · ${L.ordersN(d.orders)}">
          <rect class="hit" x="${x}" y="${T}" width="${bw}" height="${H - T - B}"/>
          ${h ? `<path class="fill" d="M${x + 2} ${H - B} V${H - B - h + 4} q0 -4 4 -4 H${x + bw - 6} q4 0 4 4 V${H - B} Z"/>` : ''}
          ${i % 5 === 4 || i === 29 ? `<text x="${x + bw / 2}" y="${H - 6}" class="axis" text-anchor="middle">${esc(label)}</text>` : ''}
        </g>`;
      })
      .join('');
    return `<div class="chart" dir="ltr"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L.salesChartLabel}">${grid}<line x1="${Lm}" x2="${W}" y1="${H - B}" y2="${H - B}" class="base"/>${bars}</svg><div class="tip" hidden></div></div>`;
  }

  function wireTips(root) {
    root.querySelectorAll('.chart').forEach((c) => {
      const tip = c.querySelector('.tip');
      c.addEventListener('pointermove', (e) => {
        const g = e.target.closest('[data-tip]');
        if (!g) return (tip.hidden = true);
        c.querySelectorAll('.bar.on').forEach((b) => b.classList.remove('on'));
        g.classList.add('on');
        tip.textContent = g.dataset.tip;
        tip.dir = lang === 'ar' ? 'rtl' : 'ltr';
        tip.hidden = false;
        const r = c.getBoundingClientRect();
        tip.style.left = `${Math.min(Math.max(e.clientX - r.left, 90), r.width - 90)}px`;
        tip.style.top = `${e.clientY - r.top - 44}px`;
      });
      c.addEventListener('pointerleave', () => {
        tip.hidden = true;
        c.querySelectorAll('.bar.on').forEach((b) => b.classList.remove('on'));
      });
    });
  }

  // Order pipeline for the last 30 days: one stacked bar, each status labelled in the legend.
  function pipeline(by) {
    const total = STATUS_KEYS.reduce((a, k) => a + (by[k] || 0), 0);
    if (!total) return `<p class="empty-small">${L.noOrdersMonth}</p>`;
    return `<div class="stack">${STATUS_KEYS.filter((k) => by[k]).map((k) => `<span class="seg s-${k}" style="flex:${by[k]}" title="${L.status[k]} : ${by[k]}"></span>`).join('')}</div>
      <ul class="legend">${STATUS_KEYS.map((k) => `<li><i class="dot s-${k}"></i>${L.status[k]}<b>${by[k] || 0}</b></li>`).join('')}</ul>`;
  }

  function hbars(rows, label, value, fmt) {
    if (!rows.length) return `<p class="empty-small">${L.nothingYet}</p>`;
    const max = Math.max(...rows.map(value), 1);
    return `<ul class="hbars">${rows.map((r) => `<li><span class="hb-label">${label(r)}</span><span class="hb-track"><span style="width:${(value(r) / max) * 100}%"></span></span><b>${fmt(r)}</b></li>`).join('')}</ul>`;
  }

  function emailCard() {
    const s = state.settings;
    const ready = state.emails && s.email_from;
    return `<section class="card email-card ${ready ? 'ok' : ''}">
      <div class="card-head"><h2>${icon('mail')} ${L.emails}</h2><span class="chip ${ready ? 'chip-ok' : 'chip-warn'}">${ready ? L.emailsOn : L.emailsOff}</span></div>
      <p class="muted">${ready ? L.emailsOnText(`<bdi>${esc(s.notify_email || s.contact_email || '—')}</bdi>`) : L.emailsOffText}</p>
      <a href="#settings" class="link-arrow">${ready ? L.emailSettings : L.setUp} ${icon('arrow', 16)}</a>
    </section>`;
  }

  async function dashboard() {
    loading(L.nav.dashboard);
    const s = await api('/stats');
    state.pending = s.new_orders || 0;
    const aov = s.orders_30d - s.failed_30d > 0 ? s.sales_30d / (s.orders_30d - s.failed_30d) : 0;
    const closed = (s.delivered_30d || 0) + (s.failed_30d || 0);
    const rate = closed ? Math.round((s.delivered_30d / closed) * 100) : null;
    const hour = new Date().getHours();
    const hello = L.hello[hour < 12 ? 0 : hour < 18 ? 1 : 2];
    const today = new Date().toLocaleDateString(L.locale, { weekday: 'long', day: 'numeric', month: 'long', numberingSystem: 'latn' });
    shell(
      `${hello} 👋`,
      `${s.new_orders ? `<a href="#orders" class="callout" data-filter="new">${icon('alert')}<span><strong>${L.pending(s.new_orders)}</strong> ${L.pendingHint}</span>${icon('arrow', 18)}</a>` : ''}
      <section class="kpis">
        <div class="kpi kpi-hero"><span class="kpi-label">${L.sales30}</span><strong class="kpi-value">${dh(s.sales_30d)}</strong>${trend(s.sales_30d || 0, s.sales_prev || 0)}<span class="kpi-foot">${L.today} : ${dh(s.today_sales)}</span></div>
        <div class="kpi"><span class="kpi-label">${L.orders30}</span><strong class="kpi-value">${num(s.orders_30d)}</strong>${trend(s.orders_30d || 0, s.orders_prev || 0)}<span class="kpi-foot">${L.today} : ${num(s.today)}</span></div>
        <div class="kpi"><span class="kpi-label">${L.aov}</span><strong class="kpi-value">${dh(aov)}</strong><span class="kpi-foot">${L.excludingCancelled}</span></div>
        <div class="kpi"><span class="kpi-label">${L.collected30}</span><strong class="kpi-value">${dh(s.revenue_30d)}</strong><span class="kpi-foot">${rate == null ? L.deliveredOrders : L.deliveredRate(rate)}</span></div>
      </section>
      <section class="grid-2">
        <div class="card span-2"><div class="card-head"><h2>${L.salesPerDay}</h2><span class="muted small">${L.last30dh}</span></div>${salesChart(s.daily)}</div>
        <div class="card"><div class="card-head"><h2>${L.pipeline}</h2><span class="muted small">${L.days30}</span></div>${pipeline(s.by_status)}</div>
        <div class="card"><div class="card-head"><h2>${L.cities}</h2><span class="muted small">${L.ordersShort30}</span></div>${hbars(s.top_cities, (r) => esc(r.city), (r) => r.n, (r) => r.n)}</div>
        <div class="card"><div class="card-head"><h2>${L.bestSellers}</h2><span class="muted small">${L.days30}</span></div>
          ${s.top_products.length ? `<ol class="top">${s.top_products.map((p, i) => `<li><span class="rank">${i + 1}</span><img src="${esc(p.image || '/assets/placeholder.svg')}" alt=""><span class="grow">${esc((lang === 'ar' && p.name_ar) || p.name)}<small>${dh(p.sales)}</small></span><b dir="ltr">${p.qty}×</b></li>`).join('')}</ol>` : `<p class="empty-small">${L.bestSellersEmpty}</p>`}
        </div>
        <div class="card"><div class="card-head"><h2>${L.latestOrders}</h2><a href="#orders" class="link-arrow">${L.seeAll} ${icon('arrow', 16)}</a></div>
          ${s.recent.length ? `<ul class="recent">${s.recent.map((o) => `<li><a href="#order-${o.id}"><span class="avatar">${esc((o.name || '?').trim().charAt(0).toUpperCase())}</span><span class="grow"><strong><bdi>${esc(o.name)}</bdi></strong><small><bdi>${esc(o.city)}</bdi> · ${ago(o.created_at)}</small></span><span class="end"><b>${dh(o.total)}</b><span class="status s-${o.status}">${L.status[o.status]}</span></span></a></li>`).join('')}</ul>` : `<p class="empty-small">${L.noOrdersYet}</p>`}
        </div>
        ${s.low_stock.length ? `<div class="card"><div class="card-head"><h2>${icon('alert')} ${L.lowStock}</h2></div><ul class="recent">${s.low_stock.map((p) => `<li><a href="#products"><img class="thumb" src="${esc(JSON.parse(p.images || '[]')[0] || '/assets/placeholder.svg')}" alt=""><span class="grow"><strong>${esc(prodName(p))}</strong></span><span class="chip ${p.stock ? 'chip-warn' : 'chip-bad'}">${p.stock ? L.left(p.stock) : L.soldOut}</span></a></li>`).join('')}</ul></div>` : ''}
        ${emailCard()}
      </section>`,
      { sub: today.charAt(0).toUpperCase() + today.slice(1), actions: `<a class="btn ghost" href="/api/admin/orders.csv">${icon('download', 18)}<span>${L.exportCsv}</span></a>` },
    );
    app.querySelector('[data-filter]')?.addEventListener('click', () => (state.status = 'new'));
    wireTips(app);
  }

  // Orders
  async function orders() {
    loading(L.nav.orders);
    const list = await api(`/orders?status=${state.status}&q=${encodeURIComponent(state.q)}`);
    state.pending = list.counts.new || 0;
    const all = Object.values(list.counts).reduce((a, b) => a + b, 0);
    const filters = [['', L.all, all], ...STATUS_KEYS.map((k) => [k, L.status[k], list.counts[k] || 0])];
    shell(
      L.nav.orders,
      `<div class="toolbar">
        <div class="filters">${filters.map(([k, v, n]) => `<button class="pill${state.status === k ? ' on' : ''}" data-status="${k}">${k ? `<i class="dot s-${k}"></i>` : ''}${v}<span>${n}</span></button>`).join('')}</div>
        <form class="search" id="osearch">${icon('search', 18)}<input type="search" name="q" value="${esc(state.q)}" placeholder="${L.searchOrders}"></form>
      </div>
      ${list.orders.length ? `<div class="card flush"><table class="table"><thead><tr><th class="hide-sm">${L.thOrder}</th><th>${L.thCustomer}</th><th class="hide-sm">${L.thCity}</th><th>${L.thTotal}</th><th>${L.thStatus}</th></tr></thead><tbody>
        ${list.orders.map((o) => `<tr data-order="${o.id}"><td class="hide-sm"><span class="mono" dir="ltr">${esc(o.number)}</span><small>${ago(o.created_at)}</small></td><td><strong><bdi>${esc(o.name)}</bdi></strong><small><bdi dir="ltr" class="hide-sm">${esc(o.phone_display)}</bdi><span class="show-sm">${ago(o.created_at)}</span>${o.email ? ` · ${icon('mail', 13)}` : ''}</small></td><td class="hide-sm">${esc(o.city)}</td><td class="nowrap"><strong>${dh(o.total)}</strong></td><td><span class="status s-${o.status}">${L.status[o.status] || o.status}</span></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="card empty">${icon('orders', 36)}<p>${state.q || state.status ? L.noMatch : L.noOrdersYet}</p></div>`}`,
      { sub: L.total(all), actions: `<a class="btn ghost" href="/api/admin/orders.csv?status=${state.status}">${icon('download', 18)}<span>${L.exportCsv}</span></a>` },
    );
    app.querySelectorAll('[data-status]').forEach((b) =>
      b.addEventListener('click', () => {
        state.status = b.dataset.status;
        orders();
      }),
    );
    document.getElementById('osearch').addEventListener('submit', (e) => {
      e.preventDefault();
      state.q = e.target.q.value.trim();
      orders();
    });
    app.querySelectorAll('[data-order]').forEach((tr) => tr.addEventListener('click', () => (location.hash = `order-${tr.dataset.order}`)));
  }

  // The WhatsApp confirmation message is written in the customer's language, not the admin's.
  function confirmMessage(o) {
    const store = state.settings.store_name || '';
    const total = o.lang === 'ar' ? `${o.total} درهم` : o.lang === 'en' ? `MAD ${o.total}` : `${o.total} DH`;
    if (o.lang === 'ar') return `السلام عليكم ${o.name}، شكرًا على طلبك رقم ${o.number} (${total}) من ${store}. هل تؤكد التوصيل إلى ${o.city}؟`;
    if (o.lang === 'en') return `Hello ${o.name}, thank you for your order ${o.number} (${total}) from ${store}. Can you confirm delivery to ${o.city}?`;
    return `Bonjour ${o.name}, merci pour votre commande ${o.number} (${total}) chez ${store}. Pouvez-vous confirmer la livraison à ${o.city} ?`;
  }

  async function orderDetail(id) {
    document.querySelector('dialog.drawer')?.close();
    const { order: o, items } = await api(`/orders/${id}`);
    const flow = ['new', 'confirmed', 'shipped', 'delivered'];
    const at = flow.indexOf(o.status);
    const emailNote = o.email && state.emails && state.settings.email_from && state.settings.email_status_updates !== '0';
    const dialog = document.createElement('dialog');
    dialog.className = 'drawer';
    dialog.innerHTML = `<form method="dialog" class="drawer-head"><div><p class="muted small">${L.orderAt} · <bdi>${when(o.created_at)}</bdi></p><h2 class="mono" dir="ltr">${esc(o.number)}</h2></div><button class="close" aria-label="${L.close}">✕</button></form>
      <ol class="steps">${flow.map((k, i) => `<li class="${at >= i ? 'done' : ''}${o.status === k ? ' now' : ''}"><span>${at >= i ? icon('check', 12) : ''}</span>${L.status[k]}</li>`).join('')}</ol>
      ${at < 0 ? `<p><span class="status s-${o.status}">${L.status[o.status]}</span></p>` : ''}
      <section class="box">
        <div class="cust"><span class="avatar lg">${esc((o.name || '?').trim().charAt(0).toUpperCase())}</span><div><strong><bdi>${esc(o.name)}</bdi></strong><small>${L.language} : ${L[o.lang] || o.lang}</small></div></div>
        <dl class="kv">
          <dt>${L.phone}</dt><dd><a href="tel:+${esc(o.phone)}" dir="ltr">${esc(o.phone_display)}</a></dd>
          ${o.email ? `<dt>${L.email}</dt><dd><a href="mailto:${esc(o.email)}" dir="ltr">${esc(o.email)}</a></dd>` : ''}
          <dt>${L.city}</dt><dd>${esc(o.city)}</dd>
          <dt>${L.address}</dt><dd>${esc(o.address)}</dd>
          ${o.note ? `<dt>${L.note}</dt><dd>« ${esc(o.note)} »</dd>` : ''}
        </dl>
        <div class="actions">
          <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}?text=${encodeURIComponent(confirmMessage(o))}">WhatsApp</a>
          <a class="btn ghost" href="tel:+${esc(o.phone)}">${icon('phone', 18)}<span>${L.call}</span></a>
        </div>
      </section>
      <section class="box">
        <ul class="lines">${items.map((i) => `<li><span>${esc(i.name)}${i.option ? ` <small>(${esc(i.option)})</small>` : ''} <small dir="ltr">× ${i.qty}</small></span><b>${dh(i.price * i.qty)}</b></li>`).join('')}
          <li class="muted"><span>${L.delivery}</span><span>${o.shipping ? dh(o.shipping) : L.free}</span></li>
          <li class="total"><span>${L.toCollect}</span><b>${dh(o.total)}</b></li></ul>
      </section>
      <label>${L.adminNote}<textarea name="admin_note" rows="2" placeholder="${L.adminNoteHint}">${esc(o.admin_note)}</textarea></label>
      <div><p class="label">${L.changeStatus}</p>
      <div class="filters">${STATUS_KEYS.map((k) => `<button type="button" class="pill${o.status === k ? ' on' : ''}" data-set="${k}"><i class="dot s-${k}"></i>${L.status[k]}</button>`).join('')}</div>
      ${emailNote ? `<p class="muted small">${icon('mail', 14)} ${L.statusEmailHint}</p>` : ''}</div>`;
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (location.hash === `#order-${id}`) history.replaceState(null, '', '#orders');
    });
    dialog.addEventListener('click', async (e) => {
      if (e.target === dialog) dialog.close();
      const set = e.target.closest('[data-set]');
      if (!set || set.dataset.set === o.status) return;
      try {
        const r = await api(`/orders/${id}`, { method: 'PATCH', body: { status: set.dataset.set, admin_note: dialog.querySelector('[name=admin_note]').value } });
        toast(r.emailed ? L.updatedEmailed : L.updated);
        dialog.close();
        orders();
      } catch (err) {
        toast(err.message, true);
      }
    });
    dialog.querySelector('[name=admin_note]').addEventListener('change', (e) => api(`/orders/${id}`, { method: 'PATCH', body: { admin_note: e.target.value } }).then(() => toast(L.noteSaved)));
    dialog.showModal();
  }

  // Products
  async function products() {
    loading(L.nav.products);
    const { products: list } = await api('/products');
    const cat = (id) => {
      const c = state.categories.find((x) => x.id === id);
      return c ? catName(c) : '—';
    };
    shell(
      L.nav.products,
      list.length
        ? `<div class="card flush"><table class="table"><thead><tr><th></th><th>${L.thProduct}</th><th class="hide-sm">${L.thCategory}</th><th>${L.thPrice}</th><th>${L.thStock}</th><th class="hide-sm">${L.thState}</th></tr></thead><tbody>
      ${list.map((p) => `<tr data-product="${p.id}"><td class="tight"><img class="thumb" src="${esc(JSON.parse(p.images || '[]')[0] || '/assets/placeholder.svg')}" alt=""></td><td><strong>${esc(prodName(p))}</strong>${p.featured ? ` <span class="chip chip-gold">${L.home}</span>` : ''}</td><td class="hide-sm">${esc(cat(p.category_id))}</td><td class="nowrap">${dh(p.price)}</td><td>${p.stock == null ? '<span class="muted">∞</span>' : p.stock <= 3 ? `<span class="chip ${p.stock ? 'chip-warn' : 'chip-bad'}">${p.stock}</span>` : p.stock}</td><td class="hide-sm">${p.active ? `<span class="chip chip-ok">${L.online}</span>` : `<span class="chip">${L.hidden}</span>`}</td></tr>`).join('')}
      </tbody></table></div>`
        : `<div class="card empty">${icon('products', 36)}<p>${L.noProducts}</p></div>`,
      { sub: L.nProducts(list.length), actions: `<button class="btn" data-new>${icon('plus', 18)}<span>${L.add}</span></button>` },
    );
    app.querySelector('[data-new]').addEventListener('click', () => productForm({ active: 1, images: '[]' }));
    app.querySelectorAll('[data-product]').forEach((tr) => tr.addEventListener('click', () => productForm(list.find((p) => p.id === Number(tr.dataset.product)))));
  }

  function productForm(p) {
    const images = JSON.parse(p.images || '[]');
    const field = (name, label, attrs = '') => `<label>${label}<input name="${name}" value="${esc(p[name] ?? '')}" ${attrs}></label>`;
    const area = (name, label, attrs = '') => `<label>${label}<textarea name="${name}" rows="3" ${attrs}>${esc(p[name] ?? '')}</textarea></label>`;
    shell(
      p.id ? L.editProduct : L.newProduct,
      `<form class="form" id="pform">
      <div class="card"><h2>${L.name}</h2><div class="cols3">
        ${contentLangs().map((l) => field(`name_${l}`, LANG_LABEL[l], dirOf(l))).join('')}
      </div></div>
      <div class="card"><h2>${L.priceStock}</h2><div class="cols">
        ${field('price', L.price, 'type="number" min="0" step="1" required inputmode="numeric"')}
        ${field('compare_price', L.comparePrice, 'type="number" min="0" step="1" inputmode="numeric"')}
        ${field('stock', L.stock, 'type="number" min="0" step="1" inputmode="numeric"')}
        <label>${L.category}<select name="category_id"><option value="">—</option>${state.categories.map((c) => `<option value="${c.id}"${c.id === p.category_id ? ' selected' : ''}>${esc(catName(c))}</option>`).join('')}</select></label>
      </div>
      ${field('options', L.options, 'placeholder="S, M, L, XL"')}</div>
      <div class="card"><h2>${L.photos}</h2>
        <div class="photos" id="photos"></div>
        <div class="drop" id="drop">
          <p><strong>${L.dropHere}</strong><br><span class="muted small">${L.dropHint}</span></p>
          <div class="actions">
            <label class="btn">${icon('plus', 18)}<span>${L.addPhotos}</span><input type="file" accept="image/*" multiple hidden data-pick></label>
            <label class="btn ghost camera">${icon('camera', 18)}<span>${L.takePhoto}</span><input type="file" accept="image/*" capture="environment" hidden data-pick></label>
          </div>
        </div>
        <details${images.some((u) => /^https?:/.test(u)) ? ' open' : ''}><summary class="muted small">${L.pasteLinks}</summary>
        <label>${L.photoLinks}<textarea name="images" rows="2" dir="ltr">${esc(images.join('\n'))}</textarea></label></details>
      </div>
      <div class="card"><h2>${L.description}</h2>
        ${contentLangs().map((l) => area(`desc_${l}`, LANG_LABEL[l], dirOf(l))).join('')}
      </div>
      <div class="card"><h2>${L.display}</h2><div class="cols">
        ${field('slug', L.slug, `placeholder="${L.auto}" dir="ltr"`)}
        ${field('sort', L.sort, 'type="number" step="1"')}
      </div>
      <label class="switch"><input type="checkbox" name="featured"${p.featured ? ' checked' : ''}><span></span> ${L.featured}</label>
      <label class="switch"><input type="checkbox" name="active"${p.active ? ' checked' : ''}><span></span> ${L.active}</label></div>
      <div class="sticky-actions"><button type="button" class="btn ghost" data-back>${L.cancel}</button>${p.id ? `<a class="btn ghost hide-sm" href="/${lang}/p/${esc(p.slug)}" target="_blank" rel="noopener">${L.view}</a><button type="button" class="btn danger" data-delete>${L.del}</button>` : ''}<button class="btn">${L.save}</button></div>
    </form>`,
    );
    const f = document.getElementById('pform');
    const list = () => f.images.value.split('\n').map((x) => x.trim()).filter(Boolean);
    const setList = (arr) => {
      f.images.value = arr.join('\n');
      drawPhotos();
    };
    let pending = []; // {id, name, preview} while uploading
    let dragFrom = null;
    const drawPhotos = () => {
      const urls = list();
      document.getElementById('photos').innerHTML =
        urls
          .map(
            (u, i) => `<figure draggable="true" data-i="${i}">${i === 0 ? `<span class="main-badge">${L.mainPhoto}</span>` : ''}<img src="${esc(u)}" alt="" loading="lazy">
            <div class="tile-actions">${i > 0 ? `<button type="button" data-move="${i}" data-by="-1" title="${L.moveBefore}" aria-label="${L.moveBefore}">${icon('chevron', 16)}</button>` : '<span></span>'}<button type="button" data-rm="${i}" title="${L.remove}" aria-label="${L.remove}">✕</button>${i < urls.length - 1 ? `<button type="button" data-move="${i}" data-by="1" class="flip" title="${L.moveAfter}" aria-label="${L.moveAfter}">${icon('chevron', 16)}</button>` : '<span></span>'}</div></figure>`,
          )
          .join('') + pending.map((x) => `<figure class="uploading"><img src="${x.preview}" alt=""><span class="spinner"></span></figure>`).join('');
    };
    drawPhotos();
    f.images.addEventListener('input', drawPhotos);
    f.addEventListener('click', async (e) => {
      if (e.target.closest('[data-back]')) products();
      const rm = e.target.closest('[data-rm]');
      if (rm) {
        const arr = list();
        arr.splice(Number(rm.dataset.rm), 1);
        setList(arr);
      }
      const mv = e.target.closest('[data-move]');
      if (mv) {
        const arr = list();
        const i = Number(mv.dataset.move);
        const j = i + Number(mv.dataset.by);
        [arr[i], arr[j]] = [arr[j], arr[i]];
        setList(arr);
      }
      if (e.target.closest('[data-delete]') && confirm(L.confirmDeleteProduct)) {
        await api(`/products/${p.id}`, { method: 'DELETE' });
        toast(L.productDeleted);
        products();
      }
    });
    // Drag tiles to reorder them.
    const grid = document.getElementById('photos');
    grid.addEventListener('dragstart', (e) => {
      const fig = e.target.closest('figure[data-i]');
      if (fig) dragFrom = Number(fig.dataset.i);
    });
    grid.addEventListener('dragover', (e) => {
      if (dragFrom != null) e.preventDefault();
    });
    grid.addEventListener('drop', (e) => {
      const fig = e.target.closest('figure[data-i]');
      if (dragFrom == null || !fig) return;
      e.preventDefault();
      const arr = list();
      const [moved] = arr.splice(dragFrom, 1);
      arr.splice(Number(fig.dataset.i), 0, moved);
      dragFrom = null;
      setList(arr);
    });
    grid.addEventListener('dragend', () => (dragFrom = null));

    // Uploads: each photo is shrunk in the browser (longest side 1600 px, WebP or JPEG) and sent as it is.
    async function shrink(file) {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const encode = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));
      let blob = await encode('image/webp', 0.84);
      if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg', 0.85); // Safari without WebP encoding
      for (let q = 0.75; blob.size > 1.5 * 1024 * 1024 && q > 0.4; q -= 0.15) blob = await encode(blob.type, q);
      return blob;
    }
    async function upload(files) {
      const jobs = [...files].map((file) => ({ file, id: Math.random(), name: file.name || 'photo', preview: URL.createObjectURL(file) }));
      pending.push(...jobs);
      drawPhotos();
      const next = async () => {
        const job = jobs.shift();
        if (!job) return;
        try {
          if (!job.file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(job.name)) throw new Error(L.notImage(job.name));
          let blob;
          try {
            blob = await shrink(job.file);
          } catch {
            throw new Error(L.notImage(job.name));
          }
          const { url } = await api('/images', { method: 'POST', raw: blob });
          f.images.value = [...list(), url].join('\n');
        } catch (err) {
          toast(err.message || L.uploadFailed(job.name), true);
        }
        pending = pending.filter((x) => x.id !== job.id);
        URL.revokeObjectURL(job.preview);
        drawPhotos();
        await next();
      };
      await Promise.all([next(), next(), next()]);
    }
    f.querySelectorAll('[data-pick]').forEach((input) =>
      input.addEventListener('change', () => {
        upload(input.files);
        input.value = '';
      }),
    );
    const drop = document.getElementById('drop');
    ['dragenter', 'dragover'].forEach((t) =>
      drop.addEventListener(t, (e) => {
        if (![...e.dataTransfer.types].includes('Files')) return;
        e.preventDefault();
        drop.classList.add('over');
      }),
    );
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
    drop.addEventListener('drop', (e) => {
      if (!e.dataTransfer.files.length) return;
      e.preventDefault();
      upload(e.dataTransfer.files);
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (pending.length) return toast(L.waitUploads, true);
      const data = Object.fromEntries(new FormData(f));
      data.featured = f.featured.checked;
      data.active = f.active.checked;
      try {
        await api(p.id ? `/products/${p.id}` : '/products', { method: p.id ? 'PUT' : 'POST', body: data });
        toast(L.productSaved);
        products();
      } catch (err) {
        toast(err.message, true);
      }
    });
  }

  // Categories
  async function categories() {
    state.categories = (await api('/categories')).categories;
    const cols = contentLangs();
    const inputs = (c) => cols.map((l) => `<td><input name="name_${l}" ${dirOf(l)} value="${esc(c[`name_${l}`] || '')}"${!c.id && l === lang ? ` placeholder="${L.newCategory}"` : ''}></td>`).join('');
    shell(
      L.nav.categories,
      `<div class="card flush"><table class="table cats"><thead><tr><th>${L.thPhoto}</th>${cols.map((l) => `<th>${LANG_LABEL[l]}</th>`).join('')}<th>${L.thPhotoLink}</th><th>${L.thSort}</th><th>${L.thProducts}</th><th></th></tr></thead><tbody>
      ${state.categories.map((c) => `<tr data-cat="${c.id}"><td><img class="thumb" src="${esc(c.image || '/assets/placeholder.svg')}" alt=""></td>${inputs(c)}<td><input name="image" dir="ltr" value="${esc(c.image || '')}" placeholder="/img/… https://…"></td><td><input name="sort" type="number" value="${c.sort}" class="num"></td><td>${c.products}</td><td class="nowrap"><button class="btn small" data-save>${L.ok}</button> <button class="link" data-del>${L.del}</button></td></tr>`).join('')}
      <tr data-cat="" class="new-row"><td></td>${inputs({})}<td><input name="image" dir="ltr" placeholder="/img/… https://…"></td><td><input name="sort" type="number" value="0" class="num"></td><td></td><td><button class="btn small" data-save>${L.add}</button></td></tr>
      </tbody></table></div>`,
      { sub: L.catsSub },
    );
    app.querySelectorAll('[data-cat]').forEach((tr) => {
      const id = tr.dataset.cat;
      tr.querySelector('[data-save]').addEventListener('click', async () => {
        const data = Object.fromEntries([...tr.querySelectorAll('input')].map((i) => [i.name, i.value]));
        if (id) data.slug = state.categories.find((c) => c.id === Number(id)).slug;
        try {
          await api(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body: data });
          toast(L.catSaved);
          categories();
        } catch (err) {
          toast(err.message, true);
        }
      });
      tr.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (!confirm(L.confirmDeleteCat)) return;
        await api(`/categories/${id}`, { method: 'DELETE' });
        categories();
      });
    });
  }

  // Settings
  function settings() {
    const s = state.settings;
    const field = (k, label, attrs = '') => `<label>${label}<input name="${k}" value="${esc(s[k] ?? '')}" ${attrs}></label>`;
    let rates = {};
    try {
      rates = JSON.parse(s.shipping_rates || '{}');
    } catch {}
    const steps = `<ol class="howto">${L.steps.map((x) => `<li>${x}</li>`).join('')}</ol>`;
    shell(
      L.nav.settings,
      `<form class="form" id="sform">
      <div class="card"><h2>${L.store}</h2><div class="cols">
        ${field('store_name', L.storeName, 'required')}
        ${field('whatsapp', L.whatsapp, 'inputmode="tel" dir="ltr"')}
        ${field('contact_email', L.contactEmail, 'type="email" dir="ltr"')}
      </div></div>
      <div class="card" id="emails"><div class="card-head"><h2>${icon('mail')} ${L.emails}</h2><span class="chip ${state.emails ? 'chip-ok' : 'chip-warn'}">${state.emails ? L.keyOk : L.keyMissing}</span></div>
        <p class="muted small">${L.emailsIntro}</p>
        ${state.emails ? '' : steps}
        <div class="cols">
          ${field('email_from', L.emailFrom, 'type="email" dir="ltr" placeholder="boutique@gmail.com"')}
          ${field('notify_email', L.notifyEmail, 'type="email" dir="ltr" placeholder="you@gmail.com"')}
        </div>
        <label class="switch"><input type="checkbox" name="email_status_updates"${s.email_status_updates !== '0' ? ' checked' : ''}><span></span> ${L.statusUpdates}</label>
        <div class="actions"><button type="button" class="btn ghost" data-test>${icon('mail', 18)}<span>${L.sendTest}</span></button></div>
        ${state.emails ? `<details><summary class="muted small">${L.howItWorks}</summary>${steps}</details>` : ''}
      </div>
      <div class="card"><h2>${L.social}</h2><p class="muted small">${L.socialHint}</p><div class="cols">
        ${field('instagram', 'Instagram', 'dir="ltr" placeholder="https://instagram.com/…"')}
        ${field('facebook', 'Facebook', 'dir="ltr" placeholder="https://facebook.com/…"')}
        ${field('tiktok', 'TikTok', 'dir="ltr" placeholder="@…"')}
      </div></div>
      <div class="card"><h2>${L.pixels}</h2><p class="muted small">${L.pixelsHint}</p><div class="cols">
        <div>${field('meta_pixel_id', L.metaPixel, 'dir="ltr" inputmode="numeric" pattern="[0-9]{8,20}" placeholder="123456789012345"')}<p class="muted small">${L.metaHow}</p></div>
        <div>${field('tiktok_pixel_id', L.tiktokPixel, 'dir="ltr" pattern="[A-Za-z0-9]{10,30}" placeholder="C4ABCDEFGHIJ1234567"')}<p class="muted small">${L.tiktokHow}</p></div>
      </div></div>
      <div class="card"><h2>${L.legal}</h2><p class="muted small">${L.legalHint}</p><div class="cols">
        ${field('legal_name', L.legalName)}
        ${field('legal_ice', L.legalIce, 'dir="ltr" inputmode="numeric"')}
        ${field('legal_rc', L.legalRc, 'dir="ltr"')}
        ${field('legal_cndp', L.legalCndp, 'dir="ltr"')}
      </div>
        ${field('legal_address', L.legalAddress)}
        <p class="muted small">${L.viewPages} <a href="/${lang}/privacy" target="_blank" rel="noopener">${L.legalPrivacy}</a> · <a href="/${lang}/terms" target="_blank" rel="noopener">${L.legalTerms}</a></p>
      </div>
      <div class="card"><h2>${L.shipping}</h2>
        <div class="cols">
          ${field('shipping_fee', L.shippingFee, 'type="number" min="0"')}
          ${field('free_shipping_over', L.freeOver, 'type="number" min="0"')}
        </div>
        <label>${L.rates}<textarea name="rates" rows="4" dir="ltr" placeholder="Casablanca = 20">${esc(Object.entries(rates).map(([c, v]) => `${c} = ${v}`).join('\n'))}</textarea></label>
      </div>
      <div class="card"><h2>${L.banner}</h2><p class="muted small">${L.bannerHint}</p>
        ${contentLangs().map((l) => field(`announcement_${l}`, LANG_LABEL[l], dirOf(l))).join('')}
      </div>
      <div class="card"><h2>${L.homePage}</h2><p class="muted small">${L.homeHint}</p><div class="cols">
        ${contentLangs().map((l) => field(`hero_title_${l}`, `${L.heroTitle} · ${LANG_LABEL[l]}`, dirOf(l)) + field(`hero_text_${l}`, `${L.heroText} · ${LANG_LABEL[l]}`, dirOf(l))).join('')}
      </div></div>
      <div class="sticky-actions"><button class="btn">${L.saveSettings}</button></div>
    </form>`,
    );
    const f = document.getElementById('sform');
    const save = async () => {
      const data = Object.fromEntries(new FormData(f));
      const map = {};
      for (const line of data.rates.split('\n')) {
        const [city, price] = line.split('=').map((x) => x?.trim());
        if (city && price !== undefined && price !== '' && !Number.isNaN(Number(price))) map[city] = Number(price);
      }
      delete data.rates;
      data.shipping_rates = JSON.stringify(map);
      data.whatsapp = data.whatsapp.replace(/\D/g, '').replace(/^0(?=[5-7])/, '212');
      data.email_status_updates = f.email_status_updates.checked ? '1' : '0';
      data.meta_pixel_id = data.meta_pixel_id.trim();
      data.tiktok_pixel_id = data.tiktok_pixel_id.trim().toUpperCase();
      await api('/settings', { method: 'PUT', body: data });
      state.settings = (await api('/settings')).settings;
    };
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await save();
        toast(L.settingsSaved);
        settings();
      } catch (err) {
        toast(err.message, true);
      }
    });
    f.querySelector('[data-test]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        await save();
        const r = await api('/test-email', { method: 'POST', body: {} });
        toast(L.testSent(r.to));
      } catch (err) {
        toast(err.message, true);
      }
      btn.disabled = false;
    });
  }

  start();
})();
