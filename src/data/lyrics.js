// --- BTS "Come Over" lyric data -------------------------------------------
//
// Each line is { o, r, en }:
//   o  : the line as it is actually sung (Korean / English mixed)
//   r  : romanization — token-aligned with `o` (English tokens stay as-is).
//        `null` means the line is already fully English, so no romanization
//        or translation row is shown.
//   en : natural English meaning of the line (only for Korean / mixed lines).
//
// `o` and `r` must contain the same number of space-separated tokens so the
// karaoke highlight lines up word-for-word.

// English-only line helper (no romanization / translation rows).
const en = (o) => ({ o, r: null, en: null });

// The chorus repeats three times — define it once for consistency.
const CHORUS = [
  {
    o: '텅 빈 듯한 밤이 오면, 이렇게 또 너를 불러',
    r: 'Teong bin deuthan bami omyeon, ireoke tto neoreul bulleo',
    en: 'When an empty-feeling night falls, I call out to you again like this',
  },
  en("Yeah, I'm lost, can I come over?"),
  en("Yeah, I'm lost, can I come over?"),
  {
    o: "I just wanna say I'm sorry, 이런 내가 너무 싫어",
    r: "I just wanna say I'm sorry, ireon naega neomu sireo",
    en: "I just wanna say I'm sorry — I hate myself for being like this",
  },
  en("Yeah, I'm lost, can I come over?"),
  en("Yeah, I'm lost, can I come over?"),
];

// "Over, over..." post-chorus (repeats twice).
const OVER = [
  en('Over, over, over, over, over'),
  en('Over, over, over, over'),
  en("You'll never love me like the way you did before"),
];

export const SONG = {
  title: 'Come Over',
  artist: 'BTS',
  defaultBpm: 120,
  lines: [
    // --- Chorus 1 ---
    ...CHORUS,

    // --- Verse 1 ---
    {
      o: "Baby, don't do me like that, 벌써 시간이 많이 지났네",
      r: "Baby, don't do me like that, beolsseo sigani mani jinanne",
      en: "Baby, don't do me like that — so much time has already passed",
    },
    {
      o: '우리 멀어진 그날 뒤에 각자 이야긴 묻어 둘까? 미안',
      r: 'uri meoreojin geunal dwie gakja iyagin mudeo dulkka? mian',
      en: "After the day we drifted apart, shall we bury each other's stories? Sorry",
    },
    {
      o: '좀 늦었지, 그동안 별일 없이 잘 지냈지?',
      r: 'jom neujeotji, geudongan byeoril eopsi jal jinaetji?',
      en: "I'm a little late, right? Have you been doing okay all this while?",
    },
    {
      o: '다시 시작하는 우리 두 번 다신 헤어지지 마',
      r: 'dasi sijakhaneun uri du beon dasin heeojiji ma',
      en: "Us, starting over again — let's never break apart a second time",
    },

    // --- Chorus 2 ---
    ...CHORUS,

    // --- Post-chorus 1 ---
    ...OVER,
    en('But would you open up if I knocked on your door?'),

    // --- Rap verse ---
    en("Knock, knock, knockin' on your door"),
    en('My blood on the floor'),
    en("Just checkin' on your door"),
    en("(What the hell am I doin' this for?)"),
    en('You act like, "Done with past life"'),
    en('Then you pass like dust in a flashlight'),
    en('Smoke in black night, we so dead, right?'),
    en('But I hate metaphors'),

    // --- Chorus 3 ---
    ...CHORUS,

    // --- Post-chorus 2 ---
    ...OVER,
    en('But would you open up if I knocked on your door? (Ay)'),

    // --- Bridge / final rap ---
    {
      o: 'Knock, knock, 네 심장을 두드려 보란 듯이, right now',
      r: 'Knock, knock, ne simjangeul dudeuryeo boran deusi, right now',
      en: 'Knock, knock — as if to pound right on your heart, right now',
    },
    {
      o: '앞뒤가 없는 삶 그저 벼랑 끝 그 앞, 앞',
      r: 'apdwiga eomneun salm geujeo byeorang kkeut geu ap, ap',
      en: "A life with no front or back, just at the cliff's edge, the edge",
    },
    {
      o: '아프고 또 울고 상관없어, can I, I?',
      r: 'apeugo tto ulgo sanggwaneopseo, can I, I?',
      en: "Hurting and crying again, I don't care — can I, I?",
    },
    {
      o: '너라면 다 개의치는 않아, my savior',
      r: 'neoramyeon da gaeuichineun ana, my savior',
      en: "If it's you, I don't mind any of it, my savior",
    },
    {
      o: '날카로워 또 베여도 그것도 나의 page',
      r: 'nalkarowo tto beyeodo geugeotdo naui page',
      en: 'Even if it cuts me sharp again, that too is a page of mine',
    },
    {
      o: "I'm past the pain, 매일 나와 싸운 이유인지 (ah)",
      r: "I'm past the pain, maeil nawa ssaun iyuinji (ah)",
      en: "I'm past the pain — maybe that's why I fought with myself every day (ah)",
    },
    {
      o: '그래, 답을 찾은 rover, 난 노 저어',
      r: 'geurae, dabeul chajeun rover, nan no jeoeo',
      en: 'Yeah, a rover who finally found the answer — I keep rowing',
    },
    en("Can I come over, o-over? 'Cause it's not over"),
  ],
};

// Split a line into karaoke tokens. `o` and `r` stay aligned index-for-index;
// for fully-English lines the romanization token mirrors the original.
export function buildWords(line) {
  const oTokens = line.o.split(/\s+/).filter(Boolean);
  const rTokens = line.r ? line.r.split(/\s+/).filter(Boolean) : oTokens;
  return oTokens.map((o, i) => ({ o, r: rTokens[i] ?? o }));
}

// Beats per token: a steady one beat each, with the final word held for two
// so each line resolves on a downbeat.
export function buildTiming(wordCount) {
  return Array.from({ length: wordCount }, (_, i) => (i === wordCount - 1 ? 2 : 1));
}
