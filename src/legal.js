// Privacy policy and terms of sale in AR/FR/EN, written for a Moroccan cash-on-delivery store
// (law 09-08 on personal data, law 31-08 on consumer protection). They are drafts: the store owner
// should have them checked by a professional. Company details come from the admin settings.

import { esc } from './lib.js';
import { pixelConfig } from './pixels.js';

const MISSING = { fr: 'à compléter', en: 'to be completed', ar: 'يُستكمل' };

function info(settings, lang) {
  const v = (k) => (settings[k] ? esc(settings[k]) : `<mark>[${MISSING[lang]}]</mark>`);
  const wa = String(settings.whatsapp || '').replace(/\D/g, '');
  return {
    store: esc(settings.store_name || 'Shop Hani'),
    name: v('legal_name'),
    ice: v('legal_ice'),
    rc: v('legal_rc'),
    address: v('legal_address'),
    cndp: v('legal_cndp'),
    email: settings.contact_email ? `<a href="mailto:${esc(settings.contact_email)}">${esc(settings.contact_email)}</a>` : `<mark>[${MISSING[lang]}]</mark>`,
    pixels: (() => {
      const px = pixelConfig(settings);
      return [px.meta && 'Meta Pixel (Facebook, Instagram)', px.tiktok && 'TikTok Pixel'].filter(Boolean).join(lang === 'ar' ? ' و' : lang === 'fr' ? ' et ' : ' and ');
    })(),
    whatsapp: wa ? `<a href="https://wa.me/${wa}" dir="ltr">+${wa}</a>` : `<mark>[${MISSING[lang]}]</mark>`,
  };
}

const PRIVACY = {
  fr: (i, lang) => ({
    title: 'Politique de confidentialité',
    sections: [
      ['Qui sommes-nous ?', `<p>La boutique en ligne ${i.store} est exploitée par ${i.name}, ICE ${i.ice}, RC ${i.rc}, ${i.address}. Contact : ${i.email} · WhatsApp ${i.whatsapp}.</p><p>Nous traitons vos données personnelles conformément à la <strong>loi n° 09-08</strong> relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel. Déclaration auprès de la CNDP : ${i.cndp}.</p>`],
      ['Les données que nous collectons', '<ul><li>Lors d’une commande : nom, numéro de téléphone, ville, adresse de livraison, remarque éventuelle et, si vous le souhaitez, adresse e-mail.</li><li>Le contenu de la commande (produits, quantités, montants) et sa date.</li><li>Des données techniques nécessaires au fonctionnement du site (journal des requêtes conservé quelques jours par notre hébergeur, pour la sécurité).</li></ul><p>Nous ne demandons aucune donnée bancaire : le paiement se fait en espèces à la livraison.</p>'],
      ['Pourquoi nous les utilisons', '<ul><li>Confirmer votre commande par téléphone ou WhatsApp, la préparer et la livrer.</li><li>Vous envoyer la confirmation et le suivi de commande par e-mail si vous avez donné votre adresse.</li><li>Gérer le service après-vente, les retours et les réclamations.</li><li>Respecter nos obligations légales, notamment comptables.</li></ul><p>Nous n’envoyons pas de publicité sans votre accord préalable et nous ne vendons jamais vos données.</p>'],
      ['Qui peut y accéder', '<ul><li>Notre équipe, pour traiter votre commande.</li><li>La société de livraison, qui reçoit uniquement votre nom, téléphone, adresse et le montant à encaisser.</li><li>Nos prestataires techniques : l’hébergeur du site (Cloudflare) et le service d’envoi d’e-mails (Brevo). Ils agissent sur nos instructions et peuvent stocker des données hors du Maroc, avec des garanties de sécurité adaptées.</li></ul>'],
      ['Combien de temps nous les gardons', '<p>Les données de commande sont conservées le temps nécessaire au traitement de la commande et au service après-vente, puis archivées pendant la durée imposée par la loi pour les documents comptables (10 ans). Elles sont ensuite supprimées.</p>'],
      ['Vos droits', `<p>Conformément à la loi 09-08, vous disposez d’un droit d’accès, de rectification et d’opposition, pour des motifs légitimes, au traitement de vos données. Pour l’exercer, écrivez-nous à ${i.email} ou sur WhatsApp ${i.whatsapp}. Nous répondons dans les meilleurs délais.</p><p>Vous pouvez aussi adresser une réclamation à la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP) : <a href="https://www.cndp.ma" rel="noopener">www.cndp.ma</a>.</p>`],
      ['Cookies et stockage', i.pixels ? `<p>Le site enregistre votre choix de langue (cookie) et le contenu de votre panier dans votre navigateur (stockage local). Les polices d’écriture sont chargées depuis Google Fonts.</p><p><strong>Publicité :</strong> si vous l’acceptez dans la bannière, nous utilisons ${i.pixels} pour mesurer l’efficacité de nos publicités (pages vues, ajouts au panier, commandes et leur montant). Ces sociétés déposent leurs propres cookies et peuvent traiter ces données hors du Maroc. Nous ne leur transmettons ni votre nom, ni votre téléphone, ni votre adresse. Sans votre accord, aucun pixel n’est chargé. Vous pouvez changer d’avis à tout moment avec le lien « Cookies » en bas de chaque page.</p>` : '<p>Le site n’utilise pas de cookies publicitaires ni de suivi. Il enregistre seulement votre choix de langue (cookie) et le contenu de votre panier dans votre navigateur (stockage local). Les polices d’écriture sont chargées depuis Google Fonts.</p>'],
      ['Sécurité', '<p>Le site est servi en HTTPS. L’accès à l’administration est protégé par mot de passe et réservé à notre équipe.</p>'],
      ['Modifications', '<p>Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de la page.</p>'],
    ],
  }),
  en: (i) => ({
    title: 'Privacy policy',
    sections: [
      ['Who we are', `<p>The online store ${i.store} is run by ${i.name}, ICE ${i.ice}, RC ${i.rc}, ${i.address}. Contact: ${i.email} · WhatsApp ${i.whatsapp}.</p><p>We process your personal data in accordance with Moroccan <strong>Law No. 09-08</strong> on the protection of individuals with regard to the processing of personal data. CNDP declaration: ${i.cndp}.</p>`],
      ['The data we collect', '<ul><li>When you order: name, phone number, city, delivery address, any note and, if you choose, an email address.</li><li>The content of the order (products, quantities, amounts) and its date.</li><li>Technical data needed to run the site (request logs kept for a few days by our host, for security).</li></ul><p>We never ask for bank details: you pay in cash on delivery.</p>'],
      ['Why we use it', '<ul><li>To confirm your order by phone or WhatsApp, prepare it and deliver it.</li><li>To email you the order confirmation and tracking updates if you gave your address.</li><li>To handle after-sales service, returns and complaints.</li><li>To meet our legal obligations, including accounting.</li></ul><p>We do not send advertising without your prior consent, and we never sell your data.</p>'],
      ['Who can access it', '<ul><li>Our team, to process your order.</li><li>The delivery company, which only receives your name, phone, address and the amount to collect.</li><li>Our technical providers: the site host (Cloudflare) and the email service (Brevo). They act on our instructions and may store data outside Morocco, with appropriate security safeguards.</li></ul>'],
      ['How long we keep it', '<p>Order data is kept for as long as needed to process the order and provide after-sales service, then archived for the period the law requires for accounting records (10 years). It is then deleted.</p>'],
      ['Your rights', `<p>Under Law 09-08 you have the right to access and correct your data and, for legitimate reasons, to object to its processing. To exercise these rights, write to ${i.email} or on WhatsApp ${i.whatsapp}. We reply as quickly as possible.</p><p>You can also complain to the National Commission for the Control of Personal Data Protection (CNDP): <a href="https://www.cndp.ma" rel="noopener">www.cndp.ma</a>.</p>`],
      ['Cookies and storage', i.pixels ? `<p>The site saves your language choice (a cookie) and your cart in your browser (local storage). Fonts are loaded from Google Fonts.</p><p><strong>Advertising:</strong> if you accept in the banner, we use ${i.pixels} to measure how well our ads work (pages viewed, items added to the cart, orders and their amount). These companies set their own cookies and may process this data outside Morocco. We never send them your name, phone number or address. Without your consent no pixel is loaded. You can change your mind at any time with the “Cookies” link at the bottom of every page.</p>` : '<p>The site uses no advertising or tracking cookies. It only saves your language choice (a cookie) and your cart in your browser (local storage). Fonts are loaded from Google Fonts.</p>'],
      ['Security', '<p>The site is served over HTTPS. The admin area is password-protected and restricted to our team.</p>'],
      ['Changes', '<p>We may update this policy. The date of the last update is shown at the top of the page.</p>'],
    ],
  }),
  ar: (i) => ({
    title: 'سياسة الخصوصية',
    sections: [
      ['من نحن؟', `<p>يُسيَّر المتجر الإلكتروني ${i.store} من طرف ${i.name}، المعرف الموحد للمقاولة (ICE) ${i.ice}، السجل التجاري ${i.rc}، ${i.address}. للتواصل: ${i.email} · واتساب ${i.whatsapp}.</p><p>نعالج معطياتك الشخصية طبقًا لـ<strong>القانون رقم 09-08</strong> المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي. التصريح لدى اللجنة الوطنية (CNDP): ${i.cndp}.</p>`],
      ['المعطيات التي نجمعها', '<ul><li>عند الطلب: الاسم، رقم الهاتف، المدينة، عنوان التوصيل، الملاحظة إن وُجدت، والبريد الإلكتروني إذا رغبت في ذلك.</li><li>محتوى الطلب (المنتجات، الكميات، المبالغ) وتاريخه.</li><li>معطيات تقنية ضرورية لاشتغال الموقع (سجل الطلبات يحتفظ به المستضيف بضعة أيام لأغراض الأمان).</li></ul><p>لا نطلب أي معطيات بنكية: الأداء يتم نقدًا عند الاستلام.</p>'],
      ['لماذا نستعملها', '<ul><li>تأكيد طلبك عبر الهاتف أو واتساب، وتحضيره وتوصيله.</li><li>إرسال تأكيد الطلب وتتبعه عبر البريد الإلكتروني إذا أدخلت عنوانك.</li><li>خدمة ما بعد البيع والإرجاع والشكايات.</li><li>احترام التزاماتنا القانونية، ومنها المحاسبية.</li></ul><p>لا نرسل إشهارات دون موافقتك المسبقة، ولا نبيع معطياتك أبدًا.</p>'],
      ['من يطّلع عليها', '<ul><li>فريقنا، لمعالجة طلبك.</li><li>شركة التوصيل، التي تتوصل فقط باسمك وهاتفك وعنوانك والمبلغ المطلوب تحصيله.</li><li>مزوّدونا التقنيون: مستضيف الموقع (Cloudflare) وخدمة إرسال البريد (Brevo). يعملون وفق تعليماتنا وقد يخزنون المعطيات خارج المغرب مع ضمانات أمان ملائمة.</li></ul>'],
      ['مدة الاحتفاظ', '<p>نحتفظ بمعطيات الطلب طوال المدة اللازمة لمعالجته ولخدمة ما بعد البيع، ثم تُؤرشف خلال المدة التي يفرضها القانون للوثائق المحاسبية (10 سنوات)، وبعدها تُحذف.</p>'],
      ['حقوقك', `<p>طبقًا للقانون 09-08، لك الحق في الولوج إلى معطياتك وتصحيحها، والتعرض لمعالجتها لأسباب مشروعة. لممارسة هذه الحقوق راسلنا على ${i.email} أو على واتساب ${i.whatsapp}، وسنجيبك في أقرب الآجال.</p><p>يمكنك أيضًا تقديم شكاية إلى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي: <a href="https://www.cndp.ma" rel="noopener">www.cndp.ma</a>.</p>`],
      ['ملفات تعريف الارتباط والتخزين', i.pixels ? `<p>يحفظ الموقع اختيارك للغة (ملف تعريف ارتباط) ومحتوى سلتك في متصفحك (التخزين المحلي). تُحمَّل الخطوط من Google Fonts.</p><p><strong>الإشهار:</strong> إذا وافقت في الشريط المخصص لذلك، نستعمل ${i.pixels} لقياس فعالية إعلاناتنا (الصفحات المزارة، الإضافات إلى السلة، الطلبات ومبالغها). تضع هذه الشركات ملفات ارتباط خاصة بها وقد تعالج هذه المعطيات خارج المغرب. لا نرسل لها اسمك ولا رقم هاتفك ولا عنوانك. بدون موافقتك لا يُحمَّل أي بيكسل، ويمكنك تغيير رأيك في أي وقت عبر رابط «ملفات الارتباط» أسفل كل صفحة.</p>` : '<p>لا يستعمل الموقع ملفات تعريف ارتباط إشهارية أو للتتبع. يحفظ فقط اختيارك للغة (ملف تعريف ارتباط) ومحتوى سلتك في متصفحك (التخزين المحلي). تُحمَّل الخطوط من Google Fonts.</p>'],
      ['الأمان', '<p>الموقع يعمل عبر HTTPS، والولوج إلى لوحة الإدارة محمي بكلمة سر ومخصص لفريقنا فقط.</p>'],
      ['التعديلات', '<p>قد نحدّث هذه السياسة، ويظهر تاريخ آخر تحديث في أعلى الصفحة.</p>'],
    ],
  }),
};

const TERMS = {
  fr: (i, s) => ({
    title: 'Conditions générales de vente',
    sections: [
      ['Vendeur', `<p>${i.store} est exploitée par ${i.name}, ICE ${i.ice}, RC ${i.rc}, ${i.address}. Contact : ${i.email} · WhatsApp ${i.whatsapp}.</p><p>Les présentes conditions s’appliquent à toute commande passée sur le site et sont régies par la <strong>loi n° 31-08</strong> édictant des mesures de protection du consommateur.</p>`],
      ['Produits et prix', `<p>Les produits sont décrits et photographiés avec le plus grand soin ; de légères différences de couleur peuvent exister selon l’écran. Les prix sont indiqués en dirhams (MAD), toutes taxes comprises. Les frais de livraison dépendent de la ville et sont affichés avant la validation de la commande${Number(s.free_shipping_over) ? ` ; la livraison est offerte à partir de ${esc(s.free_shipping_over)} DH` : ''}.</p>`],
      ['Commande', '<p>Vous passez commande en remplissant le formulaire (nom, téléphone, ville, adresse). Nous vous contactons ensuite par téléphone ou WhatsApp pour <strong>confirmer</strong> la commande avant l’expédition. Sans confirmation possible, nous pouvons annuler la commande. Nous pouvons refuser une commande en cas de motif légitime (stock épuisé, informations incomplètes, abus).</p>'],
      ['Paiement à la livraison', '<p>Le paiement se fait <strong>en espèces, au livreur, à la réception du colis</strong>, pour le montant indiqué dans la confirmation (produits + livraison). Aucun paiement en ligne n’est demandé. Dans la mesure permise par le transporteur, vous pouvez vérifier l’état du colis avant de payer.</p>'],
      ['Livraison', '<p>Nous livrons partout au Maroc. Les délais indicatifs sont de 24 à 72 heures dans les grandes villes et de 2 à 5 jours ouvrables ailleurs, à compter de la confirmation. Le livreur vous appelle avant de passer : merci de fournir un numéro joignable et une adresse précise. En cas de retard important, contactez-nous.</p>'],
      ['Refus du colis', '<p>Si le colis est abîmé ou ne correspond pas à la commande, vous pouvez le refuser au moment de la livraison et nous contacter : nous trouverons une solution sans frais pour vous. Les refus répétés sans motif, alors que la commande a été confirmée, entraînent des frais pour la boutique ; nous pouvons alors ne plus accepter de commandes payables à la livraison de la part du même client.</p>'],
      ['Droit de rétractation (retours)', '<p>Conformément à l’article 36 de la loi 31-08, vous disposez de <strong>7 jours</strong> à compter de la réception pour vous rétracter, sans avoir à vous justifier ni à payer de pénalité. Prévenez-nous par WhatsApp ou e-mail, puis renvoyez le produit non utilisé, dans son état et son emballage d’origine. Les frais de retour sont à votre charge, sauf produit défectueux ou erreur de notre part. Nous vous remboursons les sommes versées dans un délai de <strong>15 jours</strong> au plus après la réception du retour.</p><p>Le droit de rétractation ne s’applique pas, notamment, aux produits confectionnés selon vos spécifications ou personnalisés, ni aux produits qui ne peuvent être réexpédiés pour des raisons d’hygiène ou qui sont susceptibles de se détériorer (par exemple un cosmétique ou une huile ouverts).</p>'],
      ['Produits défectueux et garanties', '<p>Vous bénéficiez de la garantie légale contre les défauts de la chose vendue prévue par le Dahir formant Code des obligations et contrats et par la loi 31-08. Si un produit est défectueux ou non conforme, contactez-nous dans les meilleurs délais avec une photo : nous le remplaçons ou le remboursons, frais de retour compris.</p>'],
      ['Réclamations', `<p>Pour toute question ou réclamation : ${i.email} · WhatsApp ${i.whatsapp}. Nous nous engageons à répondre rapidement et à rechercher une solution amiable.</p>`],
      ['Données personnelles', '<p>Vos données sont traitées conformément à la loi 09-08, comme décrit dans notre <a href="/fr/privacy">politique de confidentialité</a>.</p>'],
      ['Droit applicable', '<p>Ces conditions sont soumises au droit marocain. En cas de litige, et à défaut d’accord amiable, le tribunal compétent est celui prévu par la loi 31-08, notamment celui du domicile du consommateur.</p>'],
    ],
  }),
  en: (i, s) => ({
    title: 'Terms of sale',
    sections: [
      ['Seller', `<p>${i.store} is run by ${i.name}, ICE ${i.ice}, RC ${i.rc}, ${i.address}. Contact: ${i.email} · WhatsApp ${i.whatsapp}.</p><p>These terms apply to every order placed on the site and are governed by Moroccan <strong>Law No. 31-08</strong> on consumer protection.</p>`],
      ['Products and prices', `<p>Products are described and photographed with care; colours may look slightly different on screens. Prices are in Moroccan dirhams (MAD), all taxes included. Delivery fees depend on the city and are shown before you confirm the order${Number(s.free_shipping_over) ? `; delivery is free from MAD ${esc(s.free_shipping_over)}` : ''}.</p>`],
      ['Ordering', '<p>You order by filling in the form (name, phone, city, address). We then contact you by phone or WhatsApp to <strong>confirm</strong> the order before shipping. If we cannot confirm it, we may cancel the order. We may refuse an order for a legitimate reason (out of stock, incomplete details, abuse).</p>'],
      ['Cash on delivery', '<p>You pay <strong>in cash to the courier when you receive the parcel</strong>, the amount shown in the confirmation (products + delivery). No online payment is required. Where the courier allows it, you may check the parcel before paying.</p>'],
      ['Delivery', '<p>We deliver everywhere in Morocco. Indicative times are 24 to 72 hours in major cities and 2 to 5 working days elsewhere, from confirmation. The courier calls before arriving: please give a reachable number and a precise address. If delivery is very late, contact us.</p>'],
      ['Refusing a parcel', '<p>If the parcel is damaged or does not match your order, you can refuse it on delivery and contact us: we will fix it at no cost to you. Repeated refusals without reason, after the order was confirmed, cost the store money; in that case we may stop accepting cash-on-delivery orders from the same customer.</p>'],
      ['Right of withdrawal (returns)', '<p>Under Article 36 of Law 31-08, you have <strong>7 days</strong> from receipt to withdraw from the purchase, without giving a reason or paying a penalty. Tell us by WhatsApp or email, then send the product back unused, in its original condition and packaging. Return costs are yours unless the product is faulty or we made a mistake. We refund the amounts paid within <strong>15 days</strong> at most of receiving the return.</p><p>The right of withdrawal does not apply, in particular, to items made to your specifications or personalised, or to items that cannot be sent back for hygiene reasons or that may deteriorate (for example an opened cosmetic or oil).</p>'],
      ['Faulty products and guarantees', '<p>You benefit from the legal guarantee against defects provided by the Moroccan Code of Obligations and Contracts and by Law 31-08. If a product is faulty or not as described, contact us quickly with a photo: we will replace or refund it, return costs included.</p>'],
      ['Complaints', `<p>For any question or complaint: ${i.email} · WhatsApp ${i.whatsapp}. We aim to reply quickly and find an amicable solution.</p>`],
      ['Personal data', '<p>Your data is processed in line with Law 09-08, as described in our <a href="/en/privacy">privacy policy</a>.</p>'],
      ['Governing law', '<p>These terms are governed by Moroccan law. If a dispute cannot be settled amicably, the competent court is the one set by Law 31-08, in particular that of the consumer’s place of residence.</p>'],
    ],
  }),
  ar: (i, s) => ({
    title: 'الشروط العامة للبيع',
    sections: [
      ['البائع', `<p>يُسيَّر ${i.store} من طرف ${i.name}، المعرف الموحد للمقاولة (ICE) ${i.ice}، السجل التجاري ${i.rc}، ${i.address}. للتواصل: ${i.email} · واتساب ${i.whatsapp}.</p><p>تسري هذه الشروط على كل طلب يتم عبر الموقع، وتخضع لـ<strong>القانون رقم 31-08</strong> القاضي بتحديد تدابير لحماية المستهلك.</p>`],
      ['المنتجات والأثمنة', `<p>نصف منتجاتنا ونصورها بعناية؛ قد تختلف الألوان قليلًا حسب الشاشة. الأثمنة بالدرهم المغربي وتشمل جميع الرسوم. تختلف مصاريف التوصيل حسب المدينة وتظهر قبل تأكيد الطلب${Number(s.free_shipping_over) ? `، والتوصيل مجاني ابتداءً من ${esc(s.free_shipping_over)} درهم` : ''}.</p>`],
      ['الطلب', '<p>تطلب بملء الاستمارة (الاسم، الهاتف، المدينة، العنوان). بعد ذلك نتصل بك عبر الهاتف أو واتساب <strong>لتأكيد</strong> الطلب قبل الإرسال. إذا تعذر التأكيد يمكننا إلغاء الطلب. ويمكننا رفض طلب لسبب مشروع (نفاد المخزون، معلومات ناقصة، تعسف).</p>'],
      ['الدفع عند الاستلام', '<p>يتم الأداء <strong>نقدًا لعامل التوصيل عند استلام الطرد</strong>، بالمبلغ المذكور في التأكيد (المنتجات + التوصيل). لا يُطلب أي أداء عبر الإنترنت. وفي حدود ما تسمح به شركة النقل، يمكنك التحقق من حالة الطرد قبل الأداء.</p>'],
      ['التوصيل', '<p>نوصل إلى جميع مدن المغرب. الآجال التقريبية من 24 إلى 72 ساعة في المدن الكبرى، ومن 2 إلى 5 أيام عمل في باقي المناطق، ابتداءً من التأكيد. يتصل بك عامل التوصيل قبل الوصول، فالمرجو إعطاء رقم متاح وعنوان دقيق. في حال تأخر كبير، تواصل معنا.</p>'],
      ['رفض الطرد', '<p>إذا كان الطرد متضررًا أو لا يطابق طلبك، يمكنك رفضه عند التسليم والتواصل معنا، وسنجد حلًا دون أي مصاريف عليك. أما الرفض المتكرر دون سبب بعد تأكيد الطلب فيكلّف المتجر مصاريف، وفي هذه الحالة يمكننا التوقف عن قبول طلبات الدفع عند الاستلام من نفس الزبون.</p>'],
      ['حق التراجع (الإرجاع)', '<p>طبقًا للمادة 36 من القانون 31-08، لك أجل <strong>7 أيام</strong> ابتداءً من تاريخ الاستلام لممارسة حق التراجع، دون الحاجة إلى تبرير أو أداء غرامة. أخبرنا عبر واتساب أو البريد الإلكتروني، ثم أعد المنتج غير مستعمل وبحالته وتغليفه الأصليين. مصاريف الإرجاع على عاتقك إلا إذا كان المنتج معيبًا أو كان الخطأ منا. نرد لك المبالغ المؤداة داخل أجل أقصاه <strong>15 يومًا</strong> من توصلنا بالمنتج المرجَع.</p><p>لا يسري حق التراجع خاصة على المنتجات المصنوعة حسب طلبك أو المشخصنة، ولا على المنتجات التي لا يمكن إرجاعها لأسباب صحية أو القابلة للتلف (مثل مستحضر تجميل أو زيت تم فتحه).</p>'],
      ['المنتجات المعيبة والضمان', '<p>تستفيد من الضمان القانوني للعيوب الخفية المنصوص عليه في ظهير الالتزامات والعقود وفي القانون 31-08. إذا كان المنتج معيبًا أو غير مطابق، تواصل معنا في أقرب وقت مع صورة: نستبدله أو نرد ثمنه، بما في ذلك مصاريف الإرجاع.</p>'],
      ['الشكايات', `<p>لأي سؤال أو شكاية: ${i.email} · واتساب ${i.whatsapp}. نلتزم بالرد بسرعة والبحث عن حل ودي.</p>`],
      ['المعطيات الشخصية', '<p>تُعالج معطياتك طبقًا للقانون 09-08 كما هو مبين في <a href="/ar/privacy">سياسة الخصوصية</a>.</p>'],
      ['القانون المطبق', '<p>تخضع هذه الشروط للقانون المغربي. وفي حالة نزاع وتعذر الحل الودي، تختص المحكمة التي يحددها القانون 31-08، ولا سيما محكمة موطن المستهلك.</p>'],
    ],
  }),
};

const DRAFT = {
  fr: 'Projet de texte : à faire vérifier par un juriste ou un comptable avant publication définitive.',
  en: 'Draft text: have it checked by a lawyer or accountant before final publication.',
  ar: 'نص أولي: يُستحسن مراجعته من طرف مختص قانوني أو محاسب قبل اعتماده نهائيًا.',
};
export const UPDATED = '2026-10-22';

export function legalDoc(kind, lang, settings) {
  const i = info(settings, lang);
  const doc = (kind === 'privacy' ? PRIVACY : TERMS)[lang](i, settings);
  return { ...doc, draft: DRAFT[lang], updated: UPDATED };
}
