const fs = require('fs');

const original = fs.readFileSync('constants/landingHtml.ts', 'utf8');

const frHtml = original.match(/export const LANDING_PAGE_HTML = `([\s\S]*?)`;/)[1];

let arHtml = frHtml;
arHtml = arHtml.replace('<html lang="fr">', '<html lang="ar" dir="rtl">');
arHtml = arHtml.replace('Qimatna Dz — Estimez le juste prix de votre voiture en Algérie', 'قيمتنا ديزاد — قدّر السعر العادل لسيارتك في الجزائر');

const translations = [
  ['Pourquoi nous', 'لماذا نحن'],
  ['Comment ça marche', 'كيف تعمل'],
  ['FAQ', 'أسئلة شائعة'],
  ['Estimer ma voiture', 'تقييم سيارتي'],
  ['🌐 FR / AR', '🌐 AR / FR'], // Though language button might just be FR/AR
  ['Marché Automobile Algérien · Côte en Direct', 'سوق السيارات الجزائري · تقييم مباشر'],
  ['Estimez le juste prix de votre voiture en Algérie.', 'قدّر السعر العادل لسيارتك في الجزائر.'],
  ['Grâce à notre intelligence artificielle avancée et l\\\'analyse continue du marché algérien. Obtenez une estimation chirurgicale en 1 clic, gratuitement et sans compte.', 'بفضل ذكائنا الاصطناعي المتقدم والتحليل المستمر للسوق الجزائري. احصل على تقييم دقيق بنقرة واحدة، مجانًا وبدون حساب.'],
  ['🚀 Estimer mon véhicule', '🚀 تقييم سيارتي'],
  ['📱 Application mobile', '📱 تطبيق الهاتف'],
  ['⚡ Gratuit', '⚡ مجاني'],
  ['Sans inscription', 'بدون تسجيل'],
  ['100% anonyme', 'مجهول 100%'],
  ['Résultat de l\\\'estimation', 'نتيجة التقييم'],
  ['✓ Prix Marché DZ', '✓ سعر السوق الجزائري'],
  ['Fourchette Marché', 'نطاق السوق'],
  ['Indice de confiance Expert', 'مؤشر ثقة الخبير'],
  ['Véhicule neuf (00 km)', 'سيارة جديدة (00 كم)'],
  ['NEUF +', 'جديد +'],
  ['Peinture d\\\'origine (00)', 'طلاء أصلي (00)'],
  ['FORT +', 'قوي +'],
  ['Garantie constructeur active', 'ضمان المصنع ساري'],
  ['ATOUT +', 'ميزة +'],
  ['✓ Estimation optimisée pour le marché parallèle (Square) et les transactions physiques réelles.', '✓ تقييم مُحسّن للسوق الموازية والمعاملات الفعلية.'],
  ['Vendre ce véhicule →', 'بيع هذه السيارة ←'],
  ['Annonces analysées chaque semaine en Algérie', 'إعلانات يتم تحليلها أسبوعياً في الجزائر'],
  ['Adapté aux spécificités DZ (GPL, Sbigha, 00km, Licences)', 'مُكيّف مع الخصائص الجزائرية (GPL, Sbigha, 00km, Licences)'],
  ['Totalement gratuit et accessible à tous les Algériens', 'مجاني تمامًا ومتاح لجميع الجزائريين'],
  ['Mise à jour horaire des cotes de référence du marché', 'تحديث كل ساعة لأسعار السوق المرجعية'],
  ['Pourquoi Qimatna Dz', 'لماذا قيمتنا ديزاد'],
  ['Nous ne devinons pas les prix.<br>Nous analysons la <em>réalité du terrain.</em>', 'نحن لا نخمن الأسعار.<br>نحن نحلل <em>الواقع الميداني.</em>'],
  ['Analyse multi-sources du marché', 'تحليل متعدد المصادر للسوق'],
  ['"Nous analysons la réalité du marché."', '"نحن نحلل واقع السوق."'],
  ['Notre moteur croise en temps réel les annonces actives de la journée, l\\\'historique des transactions réelles conclues en Algérie et les grilles de référence de nos experts partenaires.', 'يقوم محركنا بمقاطعة الإعلانات النشطة لليوم في الوقت الفعلي، وتاريخ المعاملات الحقيقية المبرمة في الجزائر، وشبكات الخبراء الشركاء.'],
  ['Précision "00 Compteur" et importations', 'دقة "00 عداد" والاستيراد'],
  ['"Le seul outil adapté aux spécificités algériennes."', '"الأداة الوحيدة المُكيّفة مع الخصائص الجزائرية."'],
  ['Finitions AMG Line, M Sport, licences moudjahid ou voitures "00 Compteur" : notre algorithme prend en compte la valeur exacte de toutes les finitions et les frais de douane.', 'تشطيبات AMG Line، M Sport، رخص المجاهدين أو سيارات "00 عداد": يأخذ خوارزميتنا في الاعتبار القيمة الدقيقة لجميع التشطيبات والرسوم الجمركية.'],
  ['Ajustements intelligents sur-mesure', 'تعديلات ذكية مخصصة'],
  ['"Votre voiture est unique, son prix aussi."', '"سيارتك فريدة، وسعرها أيضًا."'],
  ['Nous ajustons automatiquement la cote selon l\\\'état réel du moteur, la présence de retouches de peinture (Sbigha), l\\\'usure kilométrique et la présence d\\\'un kit GPL.', 'نقوم بتعديل التقييم تلقائيًا وفقًا للحالة الفعلية للمحرك، ووجود تنقيحات للطلاء (صبيغة)، وتآكل الأميال، ووجود مجموعة GPL.'],
  ['Comment ça marche', 'كيف تعمل'],
  ['Simple. Rapide. <em>Précis.</em>', 'بسيط. سريع. <em>دقيق.</em>'],
  ['Moins de 60 secondes pour connaître la vraie valeur de votre voiture.', 'أقل من 60 ثانية لمعرفة القيمة الحقيقية لسيارتك.'],
  ['Décrivez votre véhicule', 'صف سيارتك'],
  ['Sélectionnez la marque, le modèle précis, la finition, l\\\'année et le kilométrage réel de votre voiture. Sans aucun compte à créer.', 'حدد الماركة، الموديل الدقيق، التشطيب، السنة والمسافة الفعلية لسيارتك. بدون إنشاء أي حساب.'],
  ['L\\\'I.A. analyse le marché', 'الذكاء الاصطناعي يحلل السوق'],
  ['Notre moteur croise instantanément votre véhicule avec des milliers de points de données actifs en Algérie et applique les coefficients de dépréciation locaux.', 'يقاطع محركنا سيارتك على الفور بآلاف نقاط البيانات النشطة في الجزائر ويطبق معاملات الاستهلاك المحلية.'],
  ['Obtenez votre Verdict Expert', 'احصل على قرار الخبير'],
  ['Visualisez votre prix de vente conseillé, vos fourchettes basses et hautes, notre indice de confiance et des conseils personnalisés de négociation.', 'اعرض سعر البيع الموصى به، والنطاقات الدنيا والعليا، ومؤشر الثقة الخاص بنا، ونصائح التفاوض المخصصة.'],
  ['À qui s\\\'adresse<br><em>Qimatna Dz ?</em>', 'لمن موجه<br><em>قيمتنا ديزاد ؟</em>'],
  ['Pour qui', 'لمن موجه'],
  ['Vous vendez votre voiture ?', 'هل تبيع سيارتك ؟'],
  ['"Évitez de brader votre véhicule ou d\\\'attendre des mois à cause d\\\'un prix irréaliste."', '"تجنب بيع سيارتك بثمن بخس أو الانتظار لأشهر بسبب سعر غير واقعي."'],
  ['Fixez un prix de départ juste et restez ferme face aux négociations grâce à notre rapport d\\\'expert officiel comme référence.', 'حدد سعر بداية عادل وابق حازمًا في المفاوضات بفضل تقرير الخبير الرسمي الخاص بنا كمرجع.'],
  ['Vous achetez un véhicule ?', 'هل تشتري سيارة ؟'],
  ['"Ne vous faites plus jamais arnaquer sur les marchés d\\\'occasion physiques ou en ligne."', '"لا تتعرض للاحتيال أبدًا في أسواق السيارات المستعملة الفعلية أو عبر الإنترنت."'],
  ['Vérifiez instantanément si le prix demandé par le vendeur est cohérent avec la réalité actuelle du marché algérien.', 'تحقق فورًا مما إذا كان السعر الذي يطلبه البائع يتوافق مع الواقع الحالي للسوق الجزائري.'],
  ['Vous êtes professionnel ou showroom ?', 'هل أنت محترف أو صالة عرض ؟'],
  ['"Optimisez votre rotation de stock et achetez au bon prix."', '"قم بتحسين دوران مخزونك واشتر بالسعر المناسب."'],
  ['Suivez les tendances hebdomadaires de fluctuation des prix par wilaya et maximisez vos marges d\\\'achat-revente.', 'تابع الاتجاهات الأسبوعية لتقلبات الأسعار حسب الولاية وعظم هوامش الشراء والبيع الخاصة بك.'],
  ['Questions fréquentes', 'أسئلة شائعة'],
  ['Ce que vous <em>voulez savoir.</em>', 'ما <em>تريد معرفته.</em>'],
  ['D\\\'où proviennent vos données de prix ?', 'من أين تأتي بيانات الأسعار الخاصة بكم ؟'],
  ['Notre moteur collecte et nettoie quotidiennement les annonces publiques des plus grands sites algériens (comme Ouedkniss), intègre les prix réels de vente déclarés sur les marchés physiques d\\\'Algérie, et collabore avec des experts automobiles pour valider les cotes des véhicules neufs et d\\\'importation.', 'يجمع محركنا وينظف يوميًا الإعلانات العامة لأكبر المواقع الجزائرية (مثل واد كنيس)، ويدمج أسعار البيع الفعلية المعلنة في الأسواق الفعلية في الجزائر، ويتعاون مع خبراء السيارات للتحقق من تقييمات السيارات الجديدة والمستوردة.'],
  ['L\\\'estimation prend-elle en compte la peinture (Sbigha) et l\\\'état du moteur ?', 'هل يأخذ التقييم في الاعتبار الطلاء (صبيغة) وحالة المحرك ؟'],
  ['Oui, absolument. Qimatna Dz est le seul outil en Algérie qui ajuste le prix de vente conseillé en fonction de la présence de retouches de peinture, de l\\\'état d\\\'usure mécanique du moteur, et du niveau exact de finition du modèle.', 'نعم، بالتأكيد. قيمتنا ديزاد هي الأداة الوحيدة في الجزائر التي تعدل سعر البيع الموصى به بناءً على وجود تنقيحات الطلاء، وحالة التآكل الميكانيكي للمحرك، والمستوى الدقيق لتشطيب الموديل.'],
  ['Faut-il créer un compte pour utiliser le service ?', 'هل أحتاج إلى إنشاء حساب لاستخدام الخدمة ؟'],
  ['Non. L\\\'accès à l\\\'estimation de base et à l\\\'historique de vos recherches sur votre appareil est 100% libre, gratuit et sans compte. Vous pouvez estimer autant de voitures que vous le souhaitez, en toute discrétion.', 'لا. الوصول إلى التقييم الأساسي وتاريخ أبحاثك على جهازك مجاني 100٪ وبدون حساب. يمكنك تقييم عدد ما تشاء من السيارات، بسرية تامة.'],
  ['Puis-je exporter mon estimation pour la montrer à un acheteur ?', 'هل يمكنني تصدير التقييم لإظهاره لمشتر ؟'],
  ['Oui. Vous pouvez générer et partager le rapport de cote directement depuis l\\\'application pour l\\\'envoyer par WhatsApp, Messenger ou le montrer en face-à-face au moment de la négociation.', 'نعم. يمكنك إنشاء ومشاركة تقرير التقييم مباشرة من التطبيق لإرساله عبر WhatsApp أو Messenger أو إظهاره وجهاً لوجه وقت التفاوض.'],
  ['Prêt à connaître la <em>vraie valeur</em> de votre véhicule ?', 'هل أنت مستعد لمعرفة <em>القيمة الحقيقية</em> لسيارتك ؟'],
  ['Ne laissez plus le hasard ou les spéculations décider du prix de votre voiture. Faites confiance à la précision chirurgicale de l\\\'intelligence artificielle de Qimatna Dz.', 'لا تدع الصدفة أو المضاربات تحدد سعر سيارتك. ثق بالدقة الجراحية للذكاء الاصطناعي من قيمتنا ديزاد.'],
  ['👉 Lancer ma première estimation gratuite', '👉 ابدأ أول تقييم مجاني لي'],
  ['© 2026 Qimatna Dz · La cote réelle du marché automobile algérien', '© 2026 قيمتنا ديزاد · التقييم الفعلي لسوق السيارات الجزائري'],
  ['Gratuit', 'مجاني']
];

for (const [fr, ar] of translations) {
  // Be careful with HTML entities and exact matching
  arHtml = arHtml.split(fr).join(ar);
}

// Write the new file
const newContent = "const LANDING_PAGE_HTML_FR = `" + frHtml.replace(/`/g, '\\`') + "`;\n\n" +
                   "const LANDING_PAGE_HTML_AR = `" + arHtml.replace(/`/g, '\\`') + "`;\n\n" +
                   "export const getLandingPageHtml = (lang: string) => {\n" +
                   "  return lang === 'ar' ? LANDING_PAGE_HTML_AR : LANDING_PAGE_HTML_FR;\n" +
                   "};\n";

fs.writeFileSync('constants/landingHtml.ts', newContent);
console.log('Successfully updated landingHtml.ts');
