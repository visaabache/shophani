-- Sample catalogue so the store isn't empty on day one. Edit or delete these in the admin.
-- Photos: Unsplash (see CREDITS.md).
-- Safe to run on a store that already has data: it only removes the old artisan samples (by slug),
-- adds or refreshes the four sample categories, and adds products whose slug isn't taken yet.

-- Old artisan samples (first version of the store). Past orders keep their item names and prices.
DELETE FROM products WHERE slug IN ('huile-argan-pure','savon-beldi','rhassoul','caftan-brode','babouches-cuir',
  'tajine-terre-cuite','assiettes-safi','pouf-cuir','lanterne-ciselee','coffret-the-menthe','theiere-berrad');
DELETE FROM categories WHERE slug = 'the';
UPDATE settings SET value = 'Shop Hani' WHERE key = 'store_name' AND value IN ('Shophani', '');

INSERT INTO categories (slug, name_ar, name_fr, name_en, sort, image) VALUES
  ('high-tech', 'الإلكترونيات', 'High-tech', 'Electronics', 1, '/assets/photos/cat-tech.webp'),
  ('mode', 'الأزياء', 'Mode', 'Fashion', 2, '/assets/photos/cat-fashion.webp'),
  ('beaute', 'الجمال والعناية', 'Beauté', 'Beauty', 3, '/assets/photos/cat-beauty.webp'),
  ('maison', 'المنزل', 'Maison', 'Home', 4, '/assets/photos/cat-home.webp')
ON CONFLICT(slug) DO UPDATE SET image = excluded.image, sort = excluded.sort;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'casque-sans-fil', id,
   'سماعة رأس لاسلكية', 'Casque sans fil', 'Wireless headphones',
   'سماعة بلوتوث مريحة مع عزل للضوضاء وبطارية تدوم حتى 30 ساعة. قابلة للطي مع حقيبة.',
   'Casque Bluetooth confortable avec réduction de bruit et jusqu’à 30 h d’autonomie. Pliable, livré avec étui.',
   'Comfortable Bluetooth headphones with noise cancelling and up to 30 hours of battery. Folds flat, case included.',
   599, 799, 15, 'Noir, Blanc', '["/assets/photos/headphones.webp"]', 1, 1
  FROM categories WHERE slug = 'high-tech'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'montre-connectee', id,
   'ساعة ذكية', 'Montre connectée', 'Smartwatch',
   'تتبع الخطوات ونبض القلب والنوم، مع إشعارات الهاتف. مقاومة للماء وشاشة ملونة.',
   'Suivi des pas, du rythme cardiaque et du sommeil, avec notifications du téléphone. Étanche, écran couleur.',
   'Tracks steps, heart rate and sleep, with phone notifications. Water resistant, colour screen.',
   449, 549, 20, '', '["/assets/photos/smartwatch.webp"]', 1, 2
  FROM categories WHERE slug = 'high-tech'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'enceinte-bluetooth', id,
   'مكبر صوت بلوتوث', 'Enceinte Bluetooth', 'Bluetooth speaker',
   'صوت قوي وجهير عميق في حجم صغير. بطارية 12 ساعة، مثالي للبيت والرحلات.',
   'Son puissant et basses profondes dans un format compact. 12 h d’autonomie, idéale à la maison comme en sortie.',
   'Big sound and deep bass in a compact size. 12 hours of battery, for home or on the go.',
   299, NULL, NULL, '', '["/assets/photos/speaker.webp"]', 0, 3
  FROM categories WHERE slug = 'high-tech'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'baskets-toile', id,
   'حذاء رياضي من القماش', 'Baskets en toile', 'Canvas sneakers',
   'حذاء خفيف ومريح من القماش بنعل مطاطي، يناسب كل الإطلالات اليومية.',
   'Baskets légères en toile avec semelle en caoutchouc, pour tous les looks du quotidien.',
   'Light canvas sneakers with a rubber sole, for every everyday look.',
   349, 429, 30, '39, 40, 41, 42, 43, 44', '["/assets/photos/sneakers.webp"]', 1, 1
  FROM categories WHERE slug = 'mode'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'sac-a-main', id,
   'حقيبة يد', 'Sac à main', 'Handbag',
   'حقيبة يد أنيقة بحجم عملي، تتسع للهاتف والمحفظة ومستلزمات اليوم.',
   'Sac à main élégant au format pratique : téléphone, portefeuille et essentiels du jour.',
   'An elegant handbag in a practical size for your phone, wallet and daily essentials.',
   389, NULL, 12, 'Orange, Rouge', '["/assets/photos/handbag.webp","/assets/photos/handbag-2.webp"]', 1, 2
  FROM categories WHERE slug = 'mode'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'lunettes-de-soleil', id,
   'نظارات شمسية', 'Lunettes de soleil', 'Sunglasses',
   'نظارات شمسية بحماية UV400 وإطار خفيف، مع علبة وقطعة تنظيف.',
   'Lunettes de soleil protection UV400, monture légère, livrées avec étui et chiffonnette.',
   'UV400 sunglasses with a light frame, case and cleaning cloth included.',
   199, 249, NULL, '', '["/assets/photos/sunglasses.webp"]', 0, 3
  FROM categories WHERE slug = 'mode'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'parfum-100ml', id,
   'عطر 100 مل', 'Eau de parfum 100 ml', 'Eau de parfum 100 ml',
   'عطر زهري دافئ يدوم طويلًا، في قارورة زجاجية أنيقة. هدية مثالية.',
   'Parfum floral et chaleureux longue tenue, dans un flacon en verre ciselé. Un cadeau idéal.',
   'A warm, long-lasting floral scent in a cut-glass bottle. A perfect gift.',
   279, NULL, 25, '', '["/assets/photos/perfume.webp"]', 1, 1
  FROM categories WHERE slug = 'beaute'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'serum-visage', id,
   'سيروم للوجه', 'Sérum visage', 'Face serum',
   'سيروم مرطب بحمض الهيالورونيك لبشرة نضرة وناعمة. مناسب لكل أنواع البشرة.',
   'Sérum hydratant à l’acide hyaluronique pour une peau éclatante et douce. Tous types de peau.',
   'Hydrating hyaluronic acid serum for soft, glowing skin. For all skin types.',
   159, 199, NULL, '', '["/assets/photos/serum.webp"]', 0, 2
  FROM categories WHERE slug = 'beaute'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'lampe-a-poser', id,
   'مصباح طاولة', 'Lampe à poser', 'Table lamp',
   'مصباح بقاعدة من السيراميك وغطاء من القماش يعطي ضوءًا دافئًا لغرفة الجلوس أو النوم.',
   'Lampe à pied en céramique et abat-jour en tissu, pour une lumière douce au salon ou dans la chambre.',
   'Ceramic table lamp with a fabric shade, for soft light in the living room or bedroom.',
   329, NULL, 8, '', '["/assets/photos/lamp.webp"]', 1, 1
  FROM categories WHERE slug = 'maison'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'vase-ceramique', id,
   'مزهرية من السيراميك', 'Vase en céramique', 'Ceramic vase',
   'مزهرية بتصميم بسيط تضيف لمسة أنيقة لأي ركن في البيت.',
   'Vase au design épuré qui apporte une touche élégante à chaque coin de la maison.',
   'A minimal vase that adds a stylish touch to any corner of the home.',
   149, NULL, 15, '', '["/assets/photos/vase.webp"]', 0, 2
  FROM categories WHERE slug = 'maison'
  ON CONFLICT(slug) DO NOTHING;

INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, sort)
  SELECT 'mugs-ceramique', id,
   'طقم كوبين من السيراميك', 'Lot de 2 mugs en céramique', 'Set of 2 ceramic mugs',
   'كوبان من السيراميك للقهوة أو الشاي، يمكن غسلهما في آلة الصحون.',
   'Deux mugs en céramique pour le café ou le thé, compatibles lave-vaisselle.',
   'Two ceramic mugs for coffee or tea, dishwasher safe.',
   99, 129, NULL, '', '["/assets/photos/mug.webp"]', 0, 3
  FROM categories WHERE slug = 'maison'
  ON CONFLICT(slug) DO NOTHING;
