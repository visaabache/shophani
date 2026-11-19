-- Blog posts (written in the admin with the rich editor) and old product addresses that now redirect.
-- The starter articles link to the shop, never to a single product, so they stay valid when products change.

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL DEFAULT '',
  title_fr TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  excerpt_ar TEXT NOT NULL DEFAULT '',
  excerpt_fr TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  body_fr TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  cover TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX posts_published ON posts(published, created_at);

-- When a product is deleted or renamed, its old address redirects here (a category, the shop or the new address).
CREATE TABLE redirects (
  path TEXT PRIMARY KEY,
  target TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO posts (slug, cover, created_at, updated_at, title_ar, excerpt_ar, body_ar, title_fr, excerpt_fr, body_fr, title_en, excerpt_en, body_en) VALUES ('acheter-en-ligne-maroc-paiement-a-la-livraison', '/assets/photos/delivery.webp', datetime('now', '-1 days'), datetime('now', '-1 days'), 'الشراء عبر الإنترنت في المغرب مع الدفع عند الاستلام: الدليل الكامل', 'كيف تطلب عبر الإنترنت في المغرب بدون بطاقة بنكية: الدفع عند الاستلام، تأكيد بالهاتف، توصيل مجاني وإرجاع سهل.', '<p><strong>الدفع عند الاستلام</strong> هو الطريقة المفضلة للتسوق عبر الإنترنت في المغرب. تطلب من متجر إلكتروني، يحمل لك عامل التوصيل الطرد، وتدفع نقدًا فقط عندما يصبح بين يديك. إليك كيف يتم ذلك في شوپ هاني خطوة بخطوة.</p>
<h2>1. اختر منتجاتك</h2>
<p>تصفح <a href="/ar/shop">متجر شوپ هاني</a>: إلكترونيات، أزياء، جمال ومنزل. كل صفحة منتج تعرض الثمن النهائي والصور والوصف. <strong>لا حاجة لإنشاء حساب</strong> ولا لإدخال بطاقة بنكية.</p>
<h2>2. املأ استمارة الطلب</h2>
<p>في صفحة المنتج، أدخل اسمك الكامل ومدينتك وعنوانك ورقم هاتفك. هذا كل شيء: الطلب يستغرق أقل من دقيقة من هاتفك أو حاسوبك.</p>
<h2>3. نتصل بك للتأكيد</h2>
<p>يتصل بك فريقنا عبر الهاتف أو واتساب لتأكيد الطلب والمقاس أو اللون والعنوان الدقيق. لا يُرسل أي شيء بدون موافقتك.</p>
<h2>4. توصيل مجاني خلال 24 إلى 72 ساعة</h2>
<p><strong>التوصيل مجاني لجميع مدن المغرب</strong>: الدار البيضاء، الرباط، مراكش، فاس، طنجة، أكادير، مكناس، وجدة، القنيطرة، تطوان وباقي المدن. الثمن المعروض هو الثمن النهائي.</p>
<h2>5. ادفع لعامل التوصيل</h2>
<p>تستلم الطرد وتدفع نقدًا. وإذا لم يناسبك المنتج، لديك <strong>7 أيام لإرجاعه</strong>.</p>
<h2>لماذا الدفع عند الاستلام مريح</h2>
<ul><li>لا تشارك أي معلومات بنكية عبر الإنترنت.</li><li>ترى الطرد قبل الدفع.</li><li>تتحدث مع شخص حقيقي قبل الإرسال.</li></ul>
<p>جاهز للتجربة؟ <a href="/ar/shop">اكتشف جميع منتجاتنا</a> واطلب في ثوانٍ.</p>', 'Acheter en ligne au Maroc avec paiement à la livraison : le guide complet', 'Comment commander en ligne au Maroc sans carte bancaire : paiement à la livraison, confirmation par téléphone, livraison gratuite et retours.', '<p>Le <strong>paiement à la livraison</strong> est la façon préférée des Marocains d’acheter en ligne. Vous commandez sur une boutique en ligne, le livreur vous apporte le colis, et vous payez en espèces seulement quand vous l’avez entre les mains. Voici comment ça marche chez Shop Hani, étape par étape.</p>
<h2>1. Choisissez vos produits</h2>
<p>Parcourez la <a href="/fr/shop">boutique Shop Hani</a> : high-tech, mode, beauté et maison. Chaque fiche produit montre le prix final, les photos et la description. Il n’y a <strong>aucun compte à créer</strong> et aucune carte bancaire à saisir.</p>
<h2>2. Remplissez le formulaire de commande</h2>
<p>Sur la page du produit, indiquez votre nom complet, votre ville, votre adresse et votre numéro de téléphone. C’est tout : la commande prend moins d’une minute, depuis votre téléphone ou votre ordinateur.</p>
<h2>3. Nous vous appelons pour confirmer</h2>
<p>Notre équipe vous contacte par téléphone ou WhatsApp pour confirmer la commande, la taille ou la couleur et l’adresse exacte. Rien n’est expédié sans votre accord.</p>
<h2>4. Livraison gratuite en 24 à 72 h</h2>
<p>La <strong>livraison est gratuite partout au Maroc</strong> : Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda, Kénitra, Tétouan et toutes les autres villes. Le prix affiché est le prix final.</p>
<h2>5. Vous payez au livreur</h2>
<p>Vous recevez le colis et vous payez en espèces. Si le produit ne vous convient pas, vous disposez de <strong>7 jours pour le retourner</strong>.</p>
<h2>Pourquoi le paiement à la livraison est rassurant</h2>
<ul><li>Aucune donnée bancaire n’est partagée sur internet.</li><li>Vous voyez le colis avant de payer.</li><li>Vous parlez à une vraie personne avant l’envoi.</li></ul>
<p>Prêt à essayer ? <a href="/fr/shop">Découvrez tous nos produits</a> et commandez en quelques secondes.</p>', 'Shopping online in Morocco with cash on delivery: the complete guide', 'How to order online in Morocco without a bank card: cash on delivery, phone confirmation, free delivery and easy returns.', '<p><strong>Cash on delivery</strong> is the favourite way to shop online in Morocco. You order from an online store, the courier brings your parcel, and you pay in cash only once it is in your hands. Here is how it works at Shop Hani, step by step.</p>
<h2>1. Pick your products</h2>
<p>Browse the <a href="/en/shop">Shop Hani shop</a>: electronics, fashion, beauty and home. Every product page shows the final price, photos and a description. There is <strong>no account to create</strong> and no card to enter.</p>
<h2>2. Fill in the order form</h2>
<p>On the product page, enter your full name, city, address and phone number. That’s it: ordering takes less than a minute, from your phone or computer.</p>
<h2>3. We call you to confirm</h2>
<p>Our team calls or messages you on WhatsApp to confirm the order, the size or colour and your exact address. Nothing ships without your approval.</p>
<h2>4. Free delivery in 24 to 72 hours</h2>
<p><strong>Delivery is free anywhere in Morocco</strong>: Casablanca, Rabat, Marrakech, Fes, Tangier, Agadir, Meknes, Oujda, Kenitra, Tetouan and every other city. The price you see is the final price.</p>
<h2>5. Pay the courier</h2>
<p>You receive the parcel and pay in cash. If the product isn’t right for you, you have <strong>7 days to return it</strong>.</p>
<h2>Why cash on delivery feels safe</h2>
<ul><li>No bank details are shared online.</li><li>You see the parcel before paying.</li><li>You talk to a real person before anything ships.</li></ul>
<p>Ready to try? <a href="/en/shop">Browse all our products</a> and order in seconds.</p>');
INSERT INTO posts (slug, cover, created_at, updated_at, title_ar, excerpt_ar, body_ar, title_fr, excerpt_fr, body_fr, title_en, excerpt_en, body_en) VALUES ('livraison-gratuite-maroc-toutes-les-villes', '/assets/photos/shop-bags.webp', datetime('now', '-2 days'), datetime('now', '-2 days'), 'توصيل مجاني لجميع مدن المغرب: الآجال وطريقة العمل', 'الدار البيضاء، الرباط، مراكش، طنجة، فاس، أكادير… شوپ هاني يوصل مجانًا لجميع مدن المغرب خلال 24 إلى 72 ساعة مع الدفع عند الاستلام.', '<p>في شوپ هاني، <strong>التوصيل مجاني لجميع مدن المغرب</strong>. الثمن الذي تراه في صفحة المنتج هو بالضبط ما تدفعه لعامل التوصيل: بدون مصاريف خفية وبدون زيادة حسب المدينة.</p>
<h2>ما هي آجال التوصيل؟</h2>
<p>بعد تأكيد طلبك عبر الهاتف، احسب <strong>من 24 إلى 72 ساعة</strong> في المدن الكبرى ومن 2 إلى 5 أيام عمل في باقي المناطق. يتصل بك عامل التوصيل قبل الوصول.</p>
<h2>المدن التي نوصل إليها</h2>
<p>نوصل إلى كل مكان: <strong>الدار البيضاء، الرباط، سلا، تمارة، مراكش، فاس، طنجة، أكادير، مكناس، وجدة، القنيطرة، تطوان، الجديدة، آسفي، بني ملال، الناظور، المحمدية، خريبكة، سطات، العيون</strong> وجميع مدن وجماعات المملكة.</p>
<h2>كيف تستلم طردك بسهولة</h2>
<ul><li>أعطِ عنوانًا دقيقًا: الحي، الشارع، الرقم، علامة مميزة.</li><li>استعمل رقم هاتف متاح.</li><li>احتفظ بهاتفك قريبًا يوم التوصيل.</li></ul>
<h2>وإذا لم يعجبني المنتج؟</h2>
<p>تدفع فقط عند الاستلام، ولديك 7 أيام لإرجاع منتج لا يناسبك. راسلنا على واتساب وسننظم الإرجاع.</p>
<p><a href="/ar/shop">شاهد جميع المنتجات بالتوصيل المجاني</a></p>', 'Livraison gratuite partout au Maroc : délais et fonctionnement', 'Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir… Shop Hani livre gratuitement toutes les villes du Maroc en 24 à 72 h, paiement à la livraison.', '<p>Chez Shop Hani, la <strong>livraison est gratuite dans toutes les villes du Maroc</strong>. Le prix que vous voyez sur la page du produit est exactement ce que vous payez au livreur : pas de frais cachés, pas de supplément selon la ville.</p>
<h2>Quels sont les délais de livraison ?</h2>
<p>Après la confirmation de votre commande par téléphone, comptez <strong>24 à 72 heures</strong> dans les grandes villes et 2 à 5 jours ouvrables dans les autres régions. Le livreur vous appelle avant de passer.</p>
<h2>Les villes que nous livrons</h2>
<p>Nous livrons partout : <strong>Casablanca, Rabat, Salé, Témara, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda, Kénitra, Tétouan, El Jadida, Safi, Béni Mellal, Nador, Mohammedia, Khouribga, Settat, Laâyoune</strong> et toutes les autres villes et communes du Royaume.</p>
<h2>Comment bien recevoir votre colis</h2>
<ul><li>Indiquez une adresse précise : quartier, rue, numéro, repère.</li><li>Donnez un numéro de téléphone joignable.</li><li>Gardez votre téléphone à proximité le jour de la livraison.</li></ul>
<h2>Et si je ne suis pas satisfait ?</h2>
<p>Vous payez seulement à la réception, et vous disposez de 7 jours pour retourner un article qui ne vous convient pas. Contactez-nous sur WhatsApp, nous organisons le retour.</p>
<p><a href="/fr/shop">Voir tous les produits livrés gratuitement</a></p>', 'Free delivery anywhere in Morocco: delivery times and how it works', 'Casablanca, Rabat, Marrakech, Tangier, Fes, Agadir… Shop Hani delivers free to every city in Morocco in 24 to 72 hours, cash on delivery.', '<p>At Shop Hani, <strong>delivery is free to every city in Morocco</strong>. The price on the product page is exactly what you pay the courier: no hidden fees, no extra charge depending on your city.</p>
<h2>How long does delivery take?</h2>
<p>Once we confirm your order by phone, allow <strong>24 to 72 hours</strong> in major cities and 2 to 5 working days elsewhere. The courier calls you before arriving.</p>
<h2>Where we deliver</h2>
<p>We deliver everywhere: <strong>Casablanca, Rabat, Sale, Temara, Marrakech, Fes, Tangier, Agadir, Meknes, Oujda, Kenitra, Tetouan, El Jadida, Safi, Beni Mellal, Nador, Mohammedia, Khouribga, Settat, Laayoune</strong> and every other town in the Kingdom.</p>
<h2>Getting your parcel smoothly</h2>
<ul><li>Give a precise address: neighbourhood, street, number, landmark.</li><li>Use a phone number you answer.</li><li>Keep your phone nearby on delivery day.</li></ul>
<h2>What if I’m not happy?</h2>
<p>You only pay on arrival, and you have 7 days to return an item that isn’t right. Message us on WhatsApp and we arrange the return.</p>
<p><a href="/en/shop">See every product with free delivery</a></p>');
INSERT INTO posts (slug, cover, created_at, updated_at, title_ar, excerpt_ar, body_ar, title_fr, excerpt_fr, body_fr, title_en, excerpt_en, body_en) VALUES ('idees-cadeaux-maroc', '/assets/photos/hero-shopping.webp', datetime('now', '-3 days'), datetime('now', '-3 days'), 'أفكار هدايا في المغرب: الهدية المثالية لكل مناسبة', 'العيد، عيد الميلاد، الزفاف، عيد الأم أو عيد الحب: أفكارنا للهدايا التي تطلبها عبر الإنترنت في المغرب مع توصيل مجاني.', '<p>اختيار الهدية المناسبة ليس دائمًا سهلًا. سواء كانت لـ<strong>العيد</strong> أو <strong>عيد ميلاد</strong> أو <strong>زفاف</strong> أو <strong>عيد الأم</strong> أو عيد الحب، إليك أفكارنا، وكلها متوفرة عبر الإنترنت مع توصيل مجاني لجميع مدن المغرب.</p>
<h2>لعشاق التكنولوجيا</h2>
<p>سماعة لاسلكية، مكبر صوت بلوتوث أو ساعة ذكية هدايا تُفرح دائمًا، ومفيدة كل يوم للرياضة أو العمل أو التنقل.</p>
<h2>لها</h2>
<p>حقيبة يد أنيقة، عطر، مجموعة عناية بالبشرة أو نظارات شمسية عصرية: اختيارات مضمونة لامرأة تحب الاهتمام بنفسها.</p>
<h2>له</h2>
<p>حذاء رياضي مريح، ساعة، نظارات شمسية أو إكسسوار إلكتروني: اختر حسب ذوقه وعاداته.</p>
<h2>للمنزل</h2>
<p>مزهرية، مصباح أو أكواب جميلة، مثالية لهدية منزل جديد أو للعائلة كلها.</p>
<h2>نصائح لهدية ناجحة</h2>
<ul><li>اطلب قبل المناسبة ببضعة أيام: التوصيل يستغرق 24 إلى 72 ساعة.</li><li>بالنسبة للملابس، تأكد من المقاس معنا على واتساب.</li><li>يمكنك توصيل الهدية مباشرة إلى الشخص: أدخل عنوانه ورقم هاتفه.</li></ul>
<p><a href="/ar/shop">اعثر على فكرة هديتك في المتجر</a></p>', 'Idées cadeaux au Maroc : trouver le cadeau parfait pour chaque occasion', 'Aïd, anniversaire, mariage, fête des mères ou Saint-Valentin : nos idées de cadeaux à commander en ligne au Maroc, livrés gratuitement.', '<p>Trouver le bon cadeau n’est pas toujours simple. Que ce soit pour l’<strong>Aïd</strong>, un <strong>anniversaire</strong>, un <strong>mariage</strong>, la <strong>fête des mères</strong> ou la Saint-Valentin, voici nos idées pour faire plaisir, à commander en ligne avec livraison gratuite partout au Maroc.</p>
<h2>Pour les passionnés de high-tech</h2>
<p>Un casque sans fil, une enceinte Bluetooth ou une montre connectée font toujours plaisir. Ce sont des cadeaux utiles au quotidien, pour le sport, le travail ou les trajets.</p>
<h2>Pour elle</h2>
<p>Un sac à main élégant, un parfum, un coffret de soins pour la peau ou des lunettes de soleil tendance : des valeurs sûres pour une femme qui aime prendre soin d’elle.</p>
<h2>Pour lui</h2>
<p>Des baskets confortables, une montre, des lunettes de soleil ou un accessoire high-tech : choisissez selon son style et ses habitudes.</p>
<h2>Pour la maison</h2>
<p>Un vase, une lampe ou de jolis mugs sont parfaits pour une pendaison de crémaillère ou pour offrir à toute la famille.</p>
<h2>Nos conseils pour réussir votre cadeau</h2>
<ul><li>Commandez quelques jours avant l’occasion : la livraison prend 24 à 72 h.</li><li>Pour la mode, vérifiez la taille avec nous sur WhatsApp.</li><li>Vous pouvez faire livrer directement à la personne : indiquez son adresse et son téléphone.</li></ul>
<p><a href="/fr/shop">Trouvez votre idée cadeau dans la boutique</a></p>', 'Gift ideas in Morocco: the perfect present for every occasion', 'Eid, birthdays, weddings, Mother’s Day or Valentine’s Day: our gift ideas to order online in Morocco, with free delivery.', '<p>Finding the right gift isn’t always easy. Whether it’s for <strong>Eid</strong>, a <strong>birthday</strong>, a <strong>wedding</strong>, <strong>Mother’s Day</strong> or Valentine’s Day, here are our ideas, all available online with free delivery anywhere in Morocco.</p>
<h2>For tech lovers</h2>
<p>Wireless headphones, a Bluetooth speaker or a smartwatch always go down well. They’re useful every day, for sport, work or commuting.</p>
<h2>For her</h2>
<p>An elegant handbag, a perfume, a skincare set or trendy sunglasses: safe choices for someone who loves to treat herself.</p>
<h2>For him</h2>
<p>Comfortable sneakers, a watch, sunglasses or a tech accessory: pick according to his style and habits.</p>
<h2>For the home</h2>
<p>A vase, a lamp or a set of nice mugs is perfect for a housewarming or a gift for the whole family.</p>
<h2>Tips for a successful gift</h2>
<ul><li>Order a few days ahead: delivery takes 24 to 72 hours.</li><li>For fashion, check the size with us on WhatsApp.</li><li>You can have it delivered straight to the recipient: just give their address and phone number.</li></ul>
<p><a href="/en/shop">Find your gift idea in the shop</a></p>');
INSERT INTO posts (slug, cover, created_at, updated_at, title_ar, excerpt_ar, body_ar, title_fr, excerpt_fr, body_fr, title_en, excerpt_en, body_en) VALUES ('bien-choisir-produit-en-ligne-conseils', '/assets/photos/hero-tech.webp', datetime('now', '-4 days'), datetime('now', '-4 days'), 'كيف تختار المنتج المناسب عبر الإنترنت: 7 نصائح قبل الطلب', 'الصور، الوصف، المقاس، الإرجاع والأسئلة: 7 نصائح بسيطة لاختيار منتجاتك عبر الإنترنت في المغرب والطلب بثقة.', '<p>الشراء عبر الإنترنت يوفر الوقت بشرط أن تختار جيدًا. إليك <strong>7 نصائح بسيطة</strong> لتحصل على المنتج المناسب من أول مرة، سواء كان أزياء أو جمالًا أو إلكترونيات أو ديكورًا.</p>
<h2>1. شاهد جميع الصور</h2>
<p>تصفح معرض الصور: الصور من زوايا مختلفة تُظهر التفاصيل والخامات والألوان.</p>
<h2>2. اقرأ الوصف كاملًا</h2>
<p>المقاسات، الخامة، التوافق، محتوى الطرد: كل ما يهم موجود في وصف المنتج.</p>
<h2>3. تأكد من المقاس أو الموديل</h2>
<p>بالنسبة للملابس والأحذية، اختر مقاسك المعتاد، وإن كان لديك شك اسألنا على واتساب قبل الطلب.</p>
<h2>4. قارن الثمن النهائي</h2>
<p>في شوپ هاني الثمن المعروض هو الثمن النهائي: التوصيل مجاني ولا يُضاف أي شيء عند الدفع.</p>
<h2>5. اختر الدفع عند الاستلام</h2>
<p>تدفع فقط عند وصول الطرد: الطريقة الأكثر أمانًا للتسوق عبر الإنترنت في المغرب.</p>
<h2>6. اعرف سياسة الإرجاع</h2>
<p>لديك 7 أيام لإرجاع منتج لا يناسبك. احتفظ بالتغليف الأصلي حتى تتأكد من رغبتك في الاحتفاظ به.</p>
<h2>7. اطرح أسئلتك</h2>
<p>لديك شك في منتج؟ راسلنا على واتساب: نجيب بسرعة بالدارجة أو الفرنسية أو الإنجليزية.</p>
<p><a href="/ar/shop">تصفح المتجر</a></p>', 'Comment bien choisir un produit en ligne : 7 conseils avant de commander', 'Photos, description, taille, retours, avis : 7 conseils simples pour bien choisir vos produits en ligne au Maroc et commander sans risque.', '<p>Acheter en ligne fait gagner du temps, à condition de bien choisir. Voici <strong>7 conseils simples</strong> pour commander le bon produit du premier coup, que ce soit de la mode, de la beauté, du high-tech ou de la déco.</p>
<h2>1. Regardez toutes les photos</h2>
<p>Faites défiler la galerie : les photos sous différents angles montrent les détails, les matières et les couleurs.</p>
<h2>2. Lisez la description jusqu’au bout</h2>
<p>Dimensions, matière, compatibilité, contenu du colis : tout ce qui compte est dans la description du produit.</p>
<h2>3. Vérifiez la taille ou le modèle</h2>
<p>Pour la mode et les chaussures, choisissez votre taille habituelle et, en cas de doute, demandez-nous conseil sur WhatsApp avant de commander.</p>
<h2>4. Comparez le prix final</h2>
<p>Chez Shop Hani, le prix affiché est le prix final : la livraison est gratuite et il n’y a pas de frais au moment du paiement.</p>
<h2>5. Choisissez le paiement à la livraison</h2>
<p>Vous payez seulement quand vous recevez le colis : c’est la façon la plus sûre d’acheter en ligne au Maroc.</p>
<h2>6. Connaissez la politique de retour</h2>
<p>Vous avez 7 jours pour retourner un article qui ne vous convient pas. Gardez l’emballage d’origine jusqu’à ce que vous soyez sûr de le garder.</p>
<h2>7. Posez vos questions</h2>
<p>Un doute sur un produit ? Écrivez-nous sur WhatsApp : nous répondons rapidement, en darija, en français ou en anglais.</p>
<p><a href="/fr/shop">Parcourir la boutique</a></p>', 'How to choose the right product online: 7 tips before you order', 'Photos, description, size, returns and questions: 7 simple tips to choose the right products online in Morocco and order with confidence.', '<p>Shopping online saves time, as long as you choose well. Here are <strong>7 simple tips</strong> to get the right product the first time, whether it’s fashion, beauty, electronics or home décor.</p>
<h2>1. Look at every photo</h2>
<p>Swipe through the gallery: photos from different angles show details, materials and colours.</p>
<h2>2. Read the whole description</h2>
<p>Dimensions, material, compatibility, what’s in the box: everything that matters is in the product description.</p>
<h2>3. Check the size or model</h2>
<p>For clothes and shoes, pick your usual size and, if in doubt, ask us on WhatsApp before ordering.</p>
<h2>4. Compare the final price</h2>
<p>At Shop Hani the price shown is the final price: delivery is free and nothing is added when you pay.</p>
<h2>5. Choose cash on delivery</h2>
<p>You only pay when the parcel arrives: the safest way to shop online in Morocco.</p>
<h2>6. Know the returns policy</h2>
<p>You have 7 days to return an item that isn’t right. Keep the original packaging until you’re sure you’ll keep it.</p>
<h2>7. Ask your questions</h2>
<p>Unsure about a product? Message us on WhatsApp: we reply quickly in Darija, French or English.</p>
<p><a href="/en/shop">Browse the shop</a></p>');
INSERT INTO posts (slug, cover, created_at, updated_at, title_ar, excerpt_ar, body_ar, title_fr, excerpt_fr, body_fr, title_en, excerpt_en, body_en) VALUES ('tendances-high-tech-mode-beaute-maison-maroc', '/assets/photos/hero-home.webp', datetime('now', '-5 days'), datetime('now', '-5 days'), 'الموضة والتوجهات في المغرب: إلكترونيات، أزياء، جمال ومنزل', 'المنتجات والتوجهات التي يحبها المتسوقون في المغرب في الإلكترونيات والأزياء والجمال وديكور المنزل، اطلبها عبر الإنترنت مع توصيل مجاني.', '<p>سواء كنت تبحث عن إكسسوار إلكتروني أو ملابس جديدة أو منتج تجميل أو لمسة ديكور، إليك <strong>التوجهات التي يحبها المتسوقون في المغرب</strong> حاليًا، وما يجب معرفته لتختار جيدًا.</p>
<h2>الإلكترونيات: اللاسلكي في كل مكان</h2>
<p>السماعات اللاسلكية، مكبرات الصوت المحمولة بالبلوتوث والساعات الذكية هي الأكثر طلبًا. انتبه لمدة البطارية والتوافق مع هاتفك.</p>
<h2>الأزياء: الراحة والأناقة</h2>
<p>الأحذية الرياضية المريحة، حقائب اليد الأنيقة والنظارات الشمسية ذات الطابع الكلاسيكي في المقدمة. الألوان المحايدة (البيج، الأسود، الأبيض، الكاميل) تتناسب مع كل شيء.</p>
<h2>الجمال: روتين بسيط</h2>
<p>سيروم الوجه، المرطبات والعطور بنفحات العنبر أو الزهور مطلوبة جدًا. روتين من ثلاث خطوات (تنظيف، علاج، ترطيب) يكفي لبشرة مشرقة.</p>
<h2>المنزل: ديكور طبيعي</h2>
<p>السيراميك، الخشب الفاتح، الإضاءة الهادئة والألياف الطبيعية تخلق جوًا دافئًا. مزهرية أو مصباح أو أكواب جميلة تكفي لتغيير غرفة.</p>
<h2>اطلب هذه التوجهات بدون مخاطرة</h2>
<p>في شوپ هاني، كل الطلبات توصل مجانًا لجميع مدن المغرب وتُدفع عند الاستلام، مع 7 أيام لتغيير رأيك.</p>
<p><a href="/ar/shop">اكتشف الجديد</a></p>', 'Tendances au Maroc : high-tech, mode, beauté et maison', 'Les produits et tendances qui plaisent au Maroc en high-tech, mode, beauté et décoration, à commander en ligne avec livraison gratuite.', '<p>Que vous cherchiez un accessoire high-tech, une nouvelle tenue, un soin beauté ou une touche déco, voici les <strong>tendances qui plaisent au Maroc</strong> en ce moment, et ce qu’il faut savoir pour bien choisir.</p>
<h2>High-tech : le sans-fil partout</h2>
<p>Casques et écouteurs sans fil, enceintes Bluetooth portables et montres connectées sont les accessoires les plus demandés. Pensez à l’autonomie de la batterie et à la compatibilité avec votre téléphone.</p>
<h2>Mode : confort et élégance</h2>
<p>Les baskets confortables, les sacs à main structurés et les lunettes de soleil aux formes rétro dominent. Les couleurs neutres (beige, noir, blanc, camel) se marient avec tout.</p>
<h2>Beauté : des routines simples</h2>
<p>Les sérums visage, les soins hydratants et les parfums aux notes ambrées ou florales ont la cote. Une routine en trois gestes (nettoyer, traiter, hydrater) suffit pour une peau éclatante.</p>
<h2>Maison : déco naturelle</h2>
<p>Céramique, bois clair, lumière douce et fibres naturelles créent une ambiance chaleureuse. Un vase, une lampe ou de beaux mugs suffisent à transformer une pièce.</p>
<h2>Commander ces tendances sans risque</h2>
<p>Chez Shop Hani, toutes les commandes sont livrées gratuitement partout au Maroc et payées à la livraison, avec 7 jours pour changer d’avis.</p>
<p><a href="/fr/shop">Découvrir les nouveautés</a></p>', 'Trends in Morocco: electronics, fashion, beauty and home', 'The products and trends Moroccan shoppers love in electronics, fashion, beauty and home décor, to order online with free delivery.', '<p>Whether you’re after a tech accessory, a new outfit, a beauty product or a touch of décor, here are the <strong>trends Moroccan shoppers love</strong> right now, and what to know to choose well.</p>
<h2>Electronics: wireless everything</h2>
<p>Wireless headphones and earbuds, portable Bluetooth speakers and smartwatches are the most wanted accessories. Check battery life and compatibility with your phone.</p>
<h2>Fashion: comfort and style</h2>
<p>Comfortable sneakers, structured handbags and retro-shaped sunglasses lead the way. Neutral colours (beige, black, white, camel) go with everything.</p>
<h2>Beauty: simple routines</h2>
<p>Face serums, moisturisers and perfumes with amber or floral notes are popular. A three-step routine (cleanse, treat, moisturise) is enough for glowing skin.</p>
<h2>Home: natural décor</h2>
<p>Ceramics, light wood, soft lighting and natural fibres create a warm feel. A vase, a lamp or nice mugs are enough to change a room.</p>
<h2>Order these trends risk-free</h2>
<p>At Shop Hani every order ships free anywhere in Morocco and is paid on delivery, with 7 days to change your mind.</p>
<p><a href="/en/shop">See what’s new</a></p>');
