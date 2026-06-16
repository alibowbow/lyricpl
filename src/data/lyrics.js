// --- BTS "Come Over" lyric data (multilingual) -----------------------------
//
// Each line is { o, r, t }:
//   o : the line as sung (Korean / English mixed)
//   r : romanization, token-aligned with `o` (English tokens stay as-is).
//       `null` for fully-English lines.
//   t : translations keyed by language code. `o`/`r` drive the karaoke
//       highlight; `t` is shown as a static multi-language subtitle grid.
//
// The display dedupes any translation identical to `o`, so for English-sung
// lines the EN row (set equal to `o`) is automatically hidden.

export const TRANSLATION_LANGS = ['EN', 'JA', 'ZH', 'ES', 'PT', 'FR', 'DE', 'RU', 'ID', 'VI', 'TH', 'AR'];
export const RTL_LANGS = ['AR'];
export const LANG_LABELS = {
  EN: 'English',
  JA: '日本語',
  ZH: '中文',
  ES: 'Español',
  PT: 'Português',
  FR: 'Français',
  DE: 'Deutsch',
  RU: 'Русский',
  ID: 'Indonesia',
  VI: 'Tiếng Việt',
  TH: 'ไทย',
  AR: 'العربية',
};

// helpers: ko() for Korean/mixed lines, en() for fully-English lines.
const ko = (o, r, t) => ({ o, r, t });
const en = (o, t) => ({ o, r: null, t: { EN: o, ...t } });

// --- unique lines (defined once, reused across repeats) ---

const L_NIGHT = ko(
  '텅 빈 듯한 밤이 오면, 이렇게 또 너를 불러',
  'Teong bin deuthan bami omyeon, ireoke tto neoreul bulleo',
  {
    EN: 'When an empty-feeling night falls, I call out to you again like this',
    JA: 'がらんとした夜が来ると、こうしてまた君を呼ぶ',
    ZH: '当空荡荡的夜晚降临，我又这样呼唤你',
    ES: 'Cuando cae una noche que se siente vacía, vuelvo a llamarte así',
    PT: 'Quando cai uma noite que parece vazia, eu te chamo de novo assim',
    FR: "Quand tombe une nuit qui semble vide, je t'appelle encore ainsi",
    DE: 'Wenn eine leere Nacht hereinbricht, rufe ich dich wieder so',
    RU: 'Когда наступает пустая ночь, я снова зову тебя вот так',
    ID: 'Saat malam yang terasa kosong tiba, aku memanggilmu lagi seperti ini',
    VI: 'Khi màn đêm trống trải buông xuống, anh lại gọi tên em như thế',
    TH: 'เมื่อค่ำคืนอันว่างเปล่ามาเยือน ฉันก็เรียกหาเธออีกครั้งแบบนี้',
    AR: 'عندما يحل ليلٌ موحش، أناديك من جديد هكذا',
  },
);

const L_LOST = en("Yeah, I'm lost, can I come over?", {
  JA: 'ねえ、迷ってるんだ、そっちに行ってもいい？',
  ZH: '嘿，我迷失了，我能过去找你吗？',
  ES: 'Sí, estoy perdido, ¿puedo ir a verte?',
  PT: 'É, estou perdido, posso ir até você?',
  FR: 'Ouais, je suis perdu, je peux venir te voir ?',
  DE: 'Ja, ich bin verloren, darf ich rüberkommen?',
  RU: 'Да, я потерян, можно я приду к тебе?',
  ID: 'Ya, aku tersesat, boleh aku datang ke tempatmu?',
  VI: 'Ừ, anh lạc lối rồi, anh qua chỗ em được không?',
  TH: 'ใช่ ฉันหลงทาง ฉันแวะไปหาเธอได้ไหม?',
  AR: 'نعم، أنا تائه، هل يمكنني أن آتي إليك؟',
});

const L_SORRY = ko(
  "I just wanna say I'm sorry, 이런 내가 너무 싫어",
  "I just wanna say I'm sorry, ireon naega neomu sireo",
  {
    EN: "I just wanna say I'm sorry — I hate myself for being like this",
    JA: 'ただごめんと言いたいんだ、こんな自分が大嫌いだ',
    ZH: '我只想说声对不起，我好讨厌这样的自己',
    ES: 'Solo quiero decir que lo siento; odio ser así',
    PT: 'Só quero dizer que sinto muito; eu me odeio por ser assim',
    FR: "Je veux juste dire pardon ; je me déteste d'être comme ça",
    DE: 'Ich will nur sagen, dass es mir leidtut; ich hasse mich so',
    RU: 'Я просто хочу сказать прости — ненавижу себя такого',
    ID: 'Aku hanya ingin minta maaf; aku benci diriku yang seperti ini',
    VI: 'Anh chỉ muốn nói xin lỗi; anh ghét bản thân mình thế này',
    TH: 'ฉันแค่อยากบอกว่าขอโทษ ฉันเกลียดตัวเองที่เป็นแบบนี้',
    AR: 'أريد فقط أن أقول إنني آسف؛ أكره نفسي حين أكون هكذا',
  },
);

const L_BABY = ko(
  "Baby, don't do me like that, 벌써 시간이 많이 지났네",
  "Baby, don't do me like that, beolsseo sigani mani jinanne",
  {
    EN: "Baby, don't do me like that — so much time has already passed",
    JA: 'ベイビー、そんな風にしないで、もうずいぶん時間が経ったね',
    ZH: '宝贝，别这样对我，时间已经过去好久了',
    ES: 'Nena, no me trates así; ya ha pasado mucho tiempo',
    PT: 'Baby, não me trate assim; já passou tanto tempo',
    FR: "Bébé, ne me fais pas ça ; tant de temps a déjà passé",
    DE: 'Baby, mach das nicht mit mir; es ist schon so viel Zeit vergangen',
    RU: 'Детка, не поступай так со мной; столько времени уже прошло',
    ID: 'Sayang, jangan begitu padaku; sudah banyak waktu berlalu',
    VI: 'Em à, đừng đối xử với anh như thế; bao nhiêu thời gian đã trôi qua rồi',
    TH: 'ที่รัก อย่าทำกับฉันแบบนั้นเลย เวลาผ่านไปนานมากแล้ว',
    AR: 'حبيبتي، لا تعامليني هكذا؛ لقد مرّ وقتٌ طويل بالفعل',
  },
);

const L_BURY = ko(
  '우리 멀어진 그날 뒤에 각자 이야긴 묻어 둘까? 미안',
  'uri meoreojin geunal dwie gakja iyagin mudeo dulkka? mian',
  {
    EN: "After the day we drifted apart, shall we bury each other's stories? Sorry",
    JA: '僕らが離れたあの日の後、それぞれの話は埋めておこうか？ごめん',
    ZH: '在我们疏远的那天之后，各自的故事就埋起来好吗？对不起',
    ES: 'Después del día en que nos distanciamos, ¿enterramos cada quien su historia? Perdón',
    PT: 'Depois do dia em que nos afastamos, será que enterramos cada um sua história? Desculpa',
    FR: "Après le jour où l'on s'est éloignés, et si on enterrait chacun nos histoires ? Pardon",
    DE: 'Nach dem Tag, an dem wir uns entfernten, begraben wir vielleicht unsere Geschichten? Tut mir leid',
    RU: 'После того дня, когда мы отдалились, может, похороним каждый свою историю? Прости',
    ID: 'Setelah hari kita menjauh, haruskah kita kubur cerita masing-masing? Maaf',
    VI: 'Sau ngày chúng ta xa cách, hay là chôn giấu chuyện của mỗi người? Xin lỗi',
    TH: 'หลังจากวันที่เราห่างกัน เราฝังเรื่องราวของแต่ละคนไว้ดีไหม? ขอโทษนะ',
    AR: 'بعد اليوم الذي ابتعدنا فيه، هل ندفن قصة كلٍّ منا؟ آسف',
  },
);

const L_LATE = ko(
  '좀 늦었지, 그동안 별일 없이 잘 지냈지?',
  'jom neujeotji, geudongan byeoril eopsi jal jinaetji?',
  {
    EN: "I'm a little late, right? Have you been doing okay all this while?",
    JA: 'ちょっと遅くなったね、その間ずっと元気にしてた？',
    ZH: '我来得有点晚吧？这段时间你过得还好吗？',
    ES: 'Llegué un poco tarde, ¿no? ¿Has estado bien todo este tiempo?',
    PT: 'Cheguei um pouco tarde, né? Você ficou bem esse tempo todo?',
    FR: 'Je suis un peu en retard, non ? Tu as été bien tout ce temps ?',
    DE: 'Ich bin etwas spät dran, oder? Ging es dir die ganze Zeit gut?',
    RU: 'Я немного опоздал, да? Ты всё это время была в порядке?',
    ID: 'Aku agak terlambat, ya? Apa kabarmu baik-baik saja selama ini?',
    VI: 'Anh hơi trễ rồi nhỉ? Bấy lâu nay em vẫn ổn chứ?',
    TH: 'ฉันมาช้าไปหน่อยใช่ไหม? ที่ผ่านมาเธอสบายดีไหม?',
    AR: 'تأخرتُ قليلاً، صحيح؟ هل كنتِ بخير طوال هذا الوقت؟',
  },
);

const L_RESTART = ko(
  '다시 시작하는 우리 두 번 다신 헤어지지 마',
  'dasi sijakhaneun uri du beon dasin heeojiji ma',
  {
    EN: "Us, starting over again — let's never break apart a second time",
    JA: 'また始める僕ら、もう二度と別れないで',
    ZH: '重新开始的我们，别再分开第二次了',
    ES: 'Nosotros, empezando de nuevo; no rompamos nunca una segunda vez',
    PT: 'Nós, recomeçando; nunca mais vamos nos separar uma segunda vez',
    FR: "Nous, qui recommençons ; ne nous séparons plus jamais une deuxième fois",
    DE: 'Wir fangen neu an; lass uns nie ein zweites Mal auseinandergehen',
    RU: 'Мы начинаем заново — давай никогда больше не расстанемся',
    ID: 'Kita, memulai lagi; jangan pernah berpisah untuk kedua kalinya',
    VI: 'Chúng ta bắt đầu lại; đừng bao giờ chia tay lần thứ hai nữa',
    TH: 'เราที่เริ่มต้นใหม่ อย่าได้เลิกกันเป็นครั้งที่สองอีกเลย',
    AR: 'نحن نبدأ من جديد؛ لا نفترق مرة ثانية أبداً',
  },
);

const L_OVER5 = en('Over, over, over, over, over', {
  JA: '終わり、終わり、終わり、終わり、終わり',
  ZH: '结束，结束，结束，结束，结束',
  ES: 'Se acabó, se acabó, se acabó, se acabó, se acabó',
  PT: 'Acabou, acabou, acabou, acabou, acabou',
  FR: 'Fini, fini, fini, fini, fini',
  DE: 'Vorbei, vorbei, vorbei, vorbei, vorbei',
  RU: 'Всё, всё, всё, всё, всё',
  ID: 'Berakhir, berakhir, berakhir, berakhir, berakhir',
  VI: 'Hết rồi, hết rồi, hết rồi, hết rồi, hết rồi',
  TH: 'จบแล้ว จบแล้ว จบแล้ว จบแล้ว จบแล้ว',
  AR: 'انتهى، انتهى، انتهى، انتهى، انتهى',
});

const L_OVER4 = en('Over, over, over, over', {
  JA: '終わり、終わり、終わり、終わり',
  ZH: '结束，结束，结束，结束',
  ES: 'Se acabó, se acabó, se acabó, se acabó',
  PT: 'Acabou, acabou, acabou, acabou',
  FR: 'Fini, fini, fini, fini',
  DE: 'Vorbei, vorbei, vorbei, vorbei',
  RU: 'Всё, всё, всё, всё',
  ID: 'Berakhir, berakhir, berakhir, berakhir',
  VI: 'Hết rồi, hết rồi, hết rồi, hết rồi',
  TH: 'จบแล้ว จบแล้ว จบแล้ว จบแล้ว',
  AR: 'انتهى، انتهى، انتهى، انتهى',
});

const L_NEVERLOVE = en("You'll never love me like the way you did before", {
  JA: '君はもう、前のように僕を愛してはくれないだろう',
  ZH: '你再也不会像从前那样爱我了',
  ES: 'Nunca volverás a amarme como antes',
  PT: 'Você nunca mais vai me amar como antes',
  FR: "Tu ne m'aimeras plus jamais comme avant",
  DE: 'Du wirst mich nie wieder so lieben wie früher',
  RU: 'Ты больше никогда не полюбишь меня, как прежде',
  ID: 'Kau takkan pernah mencintaiku seperti dulu lagi',
  VI: 'Em sẽ chẳng bao giờ yêu anh như ngày trước nữa',
  TH: 'เธอจะไม่มีวันรักฉันเหมือนเมื่อก่อนอีกแล้ว',
  AR: 'لن تحبيني أبداً كما كنتِ من قبل',
});

const OPENUP_T = {
  JA: 'でも僕がドアをノックしたら、開けてくれる？',
  ZH: '但如果我敲你的门，你会开吗？',
  ES: 'Pero ¿abrirías si tocara a tu puerta?',
  PT: 'Mas você abriria se eu batesse na sua porta?',
  FR: 'Mais ouvrirais-tu si je frappais à ta porte ?',
  DE: 'Aber würdest du öffnen, wenn ich an deine Tür klopfte?',
  RU: 'Но открыла бы ты, если бы я постучал в дверь?',
  ID: 'Tapi maukah kau membuka jika kuketuk pintumu?',
  VI: 'Nhưng em có mở cửa không nếu anh gõ cửa nhà em?',
  TH: 'แต่เธอจะเปิดไหม ถ้าฉันไปเคาะประตูบ้านเธอ?',
  AR: 'لكن هل ستفتحين لو طرقتُ بابك؟',
};
const L_OPENUP = en('But would you open up if I knocked on your door?', OPENUP_T);
const L_OPENUP_AY = en('But would you open up if I knocked on your door? (Ay)', OPENUP_T);

const L_KNOCKIN = en("Knock, knock, knockin' on your door", {
  JA: 'ノック、ノック、君のドアを叩いてる',
  ZH: '敲，敲，敲着你的门',
  ES: 'Toc, toc, tocando a tu puerta',
  PT: 'Toc, toc, batendo na sua porta',
  FR: 'Toc, toc, je frappe à ta porte',
  DE: 'Klopf, klopf, ich klopfe an deine Tür',
  RU: 'Тук, тук, стучусь в твою дверь',
  ID: 'Tok, tok, mengetuk pintumu',
  VI: 'Cốc, cốc, anh gõ cửa nhà em',
  TH: 'ก๊อก ก๊อก เคาะประตูบ้านเธอ',
  AR: 'طرق، طرق، أطرق بابك',
});

const L_BLOOD = en('My blood on the floor', {
  JA: '床に流れる僕の血',
  ZH: '我的血洒在地板上',
  ES: 'Mi sangre en el suelo',
  PT: 'Meu sangue no chão',
  FR: 'Mon sang sur le sol',
  DE: 'Mein Blut auf dem Boden',
  RU: 'Моя кровь на полу',
  ID: 'Darahku di lantai',
  VI: 'Máu anh đổ trên sàn',
  TH: 'เลือดของฉันหยดบนพื้น',
  AR: 'دمي على الأرض',
});

const L_CHECKIN = en("Just checkin' on your door", {
  JA: 'ただ君のドアを確かめてる',
  ZH: '只是来看看你的门',
  ES: 'Solo vengo a ver tu puerta',
  PT: 'Só vim ver a sua porta',
  FR: 'Je viens juste voir ta porte',
  DE: 'Ich seh nur nach deiner Tür',
  RU: 'Просто проверяю твою дверь',
  ID: 'Hanya memeriksa pintumu',
  VI: 'Chỉ ghé xem cửa nhà em',
  TH: 'แค่มาดูที่ประตูบ้านเธอ',
  AR: 'أتفقّد بابك فقط',
});

const L_WHATFOR = en("(What the hell am I doin' this for?)", {
  JA: '（一体何のためにこんなことを？）',
  ZH: '（我到底为什么要这么做？）',
  ES: '(¿Para qué demonios hago esto?)',
  PT: '(Por que diabos eu faço isso?)',
  FR: '(Pourquoi diable je fais ça ?)',
  DE: '(Wofür zum Teufel mache ich das?)',
  RU: '(Какого чёрта я это делаю?)',
  ID: '(Untuk apa sih aku melakukan ini?)',
  VI: '(Rốt cuộc anh làm điều này để làm gì?)',
  TH: '(ฉันทำสิ่งนี้ไปเพื่ออะไรกันนะ?)',
  AR: '(لماذا بحق الجحيم أفعل هذا؟)',
});

const L_PASTLIFE = en('You act like, "Done with past life"', {
  JA: '君はまるで「過去とはもうおさらば」みたいに振る舞う',
  ZH: '你装作一副「与过去一刀两断」的样子',
  ES: 'Actúas como si dijeras: "Terminé con la vida pasada"',
  PT: 'Você age como quem diz: "Acabei com a vida passada"',
  FR: "Tu fais comme si : « J'en ai fini avec le passé »",
  DE: 'Du tust so, als wärst du „fertig mit dem alten Leben"',
  RU: 'Ты ведёшь себя так, будто «покончила с прошлым»',
  ID: 'Kau bersikap seolah, "Sudah selesai dengan masa lalu"',
  VI: 'Em làm như thể: "Xong rồi với quá khứ"',
  TH: 'เธอทำเหมือนจะบอกว่า "เลิกกับอดีตไปแล้ว"',
  AR: 'تتصرفين وكأنكِ: "انتهيتُ من حياتي الماضية"',
});

const L_DUST = en('Then you pass like dust in a flashlight', {
  JA: 'そして君は懐中電灯の中の埃のように過ぎていく',
  ZH: '然后你像手电筒光里的尘埃一样飘过',
  ES: 'Y luego pasas como polvo en la luz de una linterna',
  PT: 'E então você passa como poeira na luz de uma lanterna',
  FR: "Puis tu passes comme une poussière dans le faisceau d'une lampe",
  DE: 'Dann ziehst du vorbei wie Staub im Schein einer Taschenlampe',
  RU: 'А потом ты проносишься, как пыль в луче фонаря',
  ID: 'Lalu kau berlalu seperti debu dalam cahaya senter',
  VI: 'Rồi em lướt qua như hạt bụi trong ánh đèn pin',
  TH: 'แล้วเธอก็ผ่านไปเหมือนฝุ่นในลำแสงไฟฉาย',
  AR: 'ثم تمرّين كذرّة غبار في ضوء مصباح',
});

const L_SMOKE = en('Smoke in black night, we so dead, right?', {
  JA: '暗い夜に立ち込める煙、僕らもう終わってるよね？',
  ZH: '黑夜里的烟雾，我们早就死透了，对吧？',
  ES: 'Humo en la noche negra, estamos bien muertos, ¿no?',
  PT: 'Fumaça na noite negra, a gente tá morto, né?',
  FR: 'De la fumée dans la nuit noire, on est bien morts, non ?',
  DE: 'Rauch in schwarzer Nacht, wir sind sowas von tot, oder?',
  RU: 'Дым в чёрной ночи, мы ведь совсем мертвы, да?',
  ID: 'Asap di malam kelam, kita sudah mati, kan?',
  VI: 'Khói trong đêm đen, ta chết hẳn rồi, phải không?',
  TH: 'ควันในค่ำคืนมืดมิด เราตายสนิทแล้วใช่ไหม?',
  AR: 'دخانٌ في ليلٍ أسود، نحن في عداد الموتى، صحيح؟',
});

const L_METAPHOR = en('But I hate metaphors', {
  JA: 'でも僕は比喩が嫌いだ',
  ZH: '但我讨厌比喻',
  ES: 'Pero odio las metáforas',
  PT: 'Mas eu odeio metáforas',
  FR: 'Mais je déteste les métaphores',
  DE: 'Aber ich hasse Metaphern',
  RU: 'Но я ненавижу метафоры',
  ID: 'Tapi aku benci metafora',
  VI: 'Nhưng anh ghét những phép ẩn dụ',
  TH: 'แต่ฉันเกลียดการเปรียบเปรย',
  AR: 'لكنني أكره الاستعارات',
});

const L_KNOCKHEART = ko(
  'Knock, knock, 네 심장을 두드려 보란 듯이, right now',
  'Knock, knock, ne simjangeul dudeuryeo boran deusi, right now',
  {
    EN: 'Knock, knock — as if to pound right on your heart, right now',
    JA: 'ノック、ノック、君の心臓を見せつけるように叩く、今すぐ',
    ZH: '敲，敲，像要敲打你的心脏一样，就在此刻',
    ES: 'Toc, toc, como golpeando tu corazón a propósito, ahora mismo',
    PT: 'Toc, toc, como se batesse bem no seu coração, agora mesmo',
    FR: 'Toc, toc, comme pour frapper ton cœur ostensiblement, maintenant',
    DE: 'Klopf, klopf, als würde ich demonstrativ an dein Herz klopfen, jetzt sofort',
    RU: 'Тук, тук, будто демонстративно стучусь в твоё сердце, прямо сейчас',
    ID: 'Tok, tok, seakan mengetuk jantungmu terang-terangan, sekarang juga',
    VI: 'Cốc, cốc, như thể gõ thẳng vào tim em, ngay lúc này',
    TH: 'ก๊อก ก๊อก ราวกับเคาะเข้าที่หัวใจเธอ ตอนนี้เลย',
    AR: 'طرق، طرق، وكأنني أطرق على قلبك عمداً، الآن',
  },
);

const L_CLIFF = ko(
  '앞뒤가 없는 삶 그저 벼랑 끝 그 앞, 앞',
  'apdwiga eomneun salm geujeo byeorang kkeut geu ap, ap',
  {
    EN: "A life with no front or back, just at the cliff's edge, the edge",
    JA: '前も後ろもない人生、ただ崖っぷちのその先、先',
    ZH: '没有前后的人生，只在悬崖边缘，那边缘',
    ES: 'Una vida sin adelante ni atrás, justo al borde del precipicio, al borde',
    PT: 'Uma vida sem frente nem trás, bem na beira do penhasco, na beira',
    FR: 'Une vie sans avant ni arrière, juste au bord du précipice, au bord',
    DE: 'Ein Leben ohne Vorn und Hinten, direkt am Rand des Abgrunds, am Rand',
    RU: 'Жизнь без начала и конца, прямо на краю обрыва, на краю',
    ID: 'Hidup tanpa depan belakang, hanya di tepi jurang, di tepi',
    VI: 'Một cuộc đời chẳng trước chẳng sau, chỉ ở mép vực, bên mép',
    TH: 'ชีวิตที่ไร้หน้าหลัง อยู่แค่ริมหน้าผา ตรงขอบนั้น',
    AR: 'حياةٌ بلا أمامٍ ولا خلف، فقط على حافة الهاوية، على الحافة',
  },
);

const L_HURT = ko(
  '아프고 또 울고 상관없어, can I, I?',
  'apeugo tto ulgo sanggwaneopseo, can I, I?',
  {
    EN: "Hurting and crying again, I don't care — can I, I?",
    JA: '傷ついてまた泣いても構わない、いいかな、ねえ？',
    ZH: '受伤又哭泣也无所谓，我可以吗，可以吗？',
    ES: 'Duele y lloro otra vez, no me importa; ¿puedo, puedo?',
    PT: 'Doer e chorar de novo, não me importo; eu posso, posso?',
    FR: 'Souffrir et pleurer encore, peu importe ; je peux, je peux ?',
    DE: 'Schmerz und wieder Tränen, ist mir egal; darf ich, darf ich?',
    RU: 'Снова боль и слёзы, мне всё равно — можно, можно?',
    ID: 'Terluka dan menangis lagi, aku tak peduli; boleh, boleh?',
    VI: 'Đau rồi lại khóc, anh chẳng bận tâm; được không, được chứ?',
    TH: 'เจ็บแล้วก็ร้องไห้อีก ฉันไม่สนหรอก ได้ไหม ได้ไหม?',
    AR: 'أتألم وأبكي مجدداً، لا يهمني؛ هل لي، هل لي؟',
  },
);

const L_SAVIOR = ko(
  '너라면 다 개의치는 않아, my savior',
  'neoramyeon da gaeuichineun ana, my savior',
  {
    EN: "If it's you, I don't mind any of it, my savior",
    JA: '君となら、何も気にしない、僕の救い',
    ZH: '如果是你，我什么都不介意，我的救赎',
    ES: 'Si eres tú, nada me importa, mi salvación',
    PT: 'Se for você, não me importo com nada, minha salvação',
    FR: "Si c'est toi, rien ne me dérange, mon salut",
    DE: 'Wenn du es bist, macht mir nichts etwas aus, meine Rettung',
    RU: 'Если это ты, мне всё нипочём, моё спасение',
    ID: 'Kalau kau, aku tak keberatan apa pun, penyelamatku',
    VI: 'Nếu là em, anh chẳng ngại điều gì, vị cứu tinh của anh',
    TH: 'ถ้าเป็นเธอ ฉันไม่ถือสาอะไรเลย ผู้ช่วยชีวิตของฉัน',
    AR: 'إن كنتِ أنتِ، فلا يهمني شيء، يا منقذتي',
  },
);

const L_PAGE = ko(
  '날카로워 또 베여도 그것도 나의 page',
  'nalkarowo tto beyeodo geugeotdo naui page',
  {
    EN: 'Even if it cuts me sharp again, that too is a page of mine',
    JA: '鋭くてまた切られても、それも僕のページ',
    ZH: '再锋利再割伤我，那也是我的一页',
    ES: 'Aunque sea filoso y vuelva a cortarme, eso también es una página mía',
    PT: 'Mesmo que seja afiado e me corte de novo, isso também é uma página minha',
    FR: "Même si c'est tranchant et que ça me coupe encore, c'est aussi une page de moi",
    DE: 'Auch wenn es scharf ist und mich wieder schneidet, ist das auch meine Seite',
    RU: 'Пусть оно остро и снова режет — это тоже моя страница',
    ID: 'Meski tajam dan melukaiku lagi, itu pun halaman milikku',
    VI: 'Dù sắc bén và lại cứa vào anh, đó cũng là một trang của anh',
    TH: 'ต่อให้คมและบาดฉันอีก นั่นก็เป็นหน้าหนึ่งของฉัน',
    AR: 'حتى لو كان حاداً وجرحني مجدداً، فذلك أيضاً صفحة من صفحاتي',
  },
);

const L_PASTPAIN = ko(
  "I'm past the pain, 매일 나와 싸운 이유인지 (ah)",
  "I'm past the pain, maeil nawa ssaun iyuinji (ah)",
  {
    EN: "I'm past the pain — maybe that's why I fought with myself every day (ah)",
    JA: 'もう痛みは越えた、毎日自分と闘ってきたからかな（ああ）',
    ZH: '我已越过伤痛，也许这就是我每天与自己搏斗的理由（啊）',
    ES: 'Ya superé el dolor; quizá por eso peleaba conmigo cada día (ah)',
    PT: 'Já superei a dor; talvez seja por isso que eu brigava comigo todo dia (ah)',
    FR: "J'ai dépassé la douleur ; c'est peut-être pour ça que je me battais chaque jour (ah)",
    DE: 'Ich bin über den Schmerz hinweg; vielleicht kämpfte ich deshalb täglich mit mir (ah)',
    RU: 'Я прошёл сквозь боль — может, потому и боролся с собой каждый день (а)',
    ID: 'Aku sudah lewati rasa sakit; mungkin itu alasanku bertarung dengan diriku tiap hari (ah)',
    VI: 'Anh đã vượt qua nỗi đau; có lẽ vì thế mà mỗi ngày anh đấu tranh với chính mình (ah)',
    TH: 'ฉันผ่านความเจ็บปวดมาแล้ว บางทีนั่นคือเหตุที่ฉันสู้กับตัวเองทุกวัน (อา)',
    AR: 'تجاوزتُ الألم؛ ربما لهذا كنت أصارع نفسي كل يوم (آه)',
  },
);

const L_ROVER = ko(
  '그래, 답을 찾은 rover, 난 노 저어',
  'geurae, dabeul chajeun rover, nan no jeoeo',
  {
    EN: 'Yeah, a rover who finally found the answer — I keep rowing',
    JA: 'そう、答えを見つけた漂流者、僕は櫂を漕ぐ',
    ZH: '没错，找到答案的漫游者，我划着桨',
    ES: 'Sí, un vagabundo que halló la respuesta; sigo remando',
    PT: 'É, um andarilho que achou a resposta; eu sigo remando',
    FR: "Ouais, un vagabond qui a trouvé la réponse ; je continue de ramer",
    DE: 'Ja, ein Wanderer, der die Antwort fand; ich rudere weiter',
    RU: 'Да, скиталец, нашедший ответ — я гребу',
    ID: 'Ya, pengembara yang menemukan jawaban; aku terus mendayung',
    VI: 'Ừ, kẻ lang thang đã tìm ra lời đáp; anh cứ chèo tiếp',
    TH: 'ใช่ คนพเนจรที่พบคำตอบแล้ว ฉันพายเรือต่อไป',
    AR: 'نعم، جوّابٌ وجد الجواب؛ وأنا أجدّف',
  },
);

const L_NOTOVER = en("Can I come over, o-over? 'Cause it's not over", {
  JA: 'そっちに行ってもいい、ねえ？だってまだ終わってないから',
  ZH: '我能过去吗，过去？因为还没有结束',
  ES: '¿Puedo ir a verte, a verte? Porque esto no se acaba',
  PT: 'Posso ir até você, até você? Porque ainda não acabou',
  FR: 'Je peux venir, venir ? Parce que ce n\'est pas fini',
  DE: 'Darf ich rüberkommen, rüber? Denn es ist nicht vorbei',
  RU: 'Можно я приду, приду? Ведь это не конец',
  ID: 'Boleh aku datang, datang? Karena ini belum berakhir',
  VI: 'Anh qua được không, qua nhé? Vì mọi chuyện chưa kết thúc',
  TH: 'ฉันแวะไปได้ไหม ไปนะ? เพราะมันยังไม่จบ',
  AR: 'هل يمكنني أن آتي، أن آتي؟ لأن الأمر لم ينتهِ بعد',
});

// chorus repeats 3×; post-chorus "Over..." block repeats 2×.
const CHORUS = [L_NIGHT, L_LOST, L_LOST, L_SORRY, L_LOST, L_LOST];
const OVER = [L_OVER5, L_OVER4, L_NEVERLOVE];

export const SONG = {
  title: 'Come Over',
  artist: 'BTS',
  defaultBpm: 120,
  lines: [
    ...CHORUS, // chorus 1
    L_BABY, L_BURY, L_LATE, L_RESTART, // verse 1
    ...CHORUS, // chorus 2
    ...OVER, L_OPENUP, // post-chorus 1
    L_KNOCKIN, L_BLOOD, L_CHECKIN, L_WHATFOR, // rap
    L_PASTLIFE, L_DUST, L_SMOKE, L_METAPHOR,
    ...CHORUS, // chorus 3
    ...OVER, L_OPENUP_AY, // post-chorus 2
    L_KNOCKHEART, L_CLIFF, L_HURT, L_SAVIOR, // bridge / final rap
    L_PAGE, L_PASTPAIN, L_ROVER, L_NOTOVER,
  ],
};

// Split a line into karaoke tokens; `o`/`r` stay index-aligned.
export function buildWords(line) {
  const oTokens = line.o.split(/\s+/).filter(Boolean);
  const rTokens = line.r ? line.r.split(/\s+/).filter(Boolean) : oTokens;
  return oTokens.map((o, i) => ({ o, r: rTokens[i] ?? o }));
}

// One beat per word, final word held two beats so the line lands on a downbeat.
export function buildTiming(wordCount) {
  return Array.from({ length: wordCount }, (_, i) => (i === wordCount - 1 ? 2 : 1));
}
