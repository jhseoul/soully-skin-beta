// Question bank v4.1 — redesigned for two test lengths sharing one axis system.
//
// QUICK 16 (mode "quick"): 4 axes (OD/SR/PN/WT), 18 questions, ~1-2 min.
// DEEP  64 (mode "deep"):  6 axes (OD/SR/PN/WT/CB/HQ), 48 type questions
//   (8 per axis — the same 18 used by QUICK plus 30 more, including all of
//   CB/HQ, which QUICK never asks) + 7 bonus STATE questions ("최근의 내
//   피부") + 1 validation-only self-perception question, 56 questions
//   total, ~5-6 min.
//
// v4.1 added 2 questions to each of OD/PN/WT/CB/HQ (SR was already at 8) to
// equalize every TYPE axis at 8 questions, 1 more STATE question, and the
// first `validationOnly` question — a self-reported skin type used only as
// a reference point against the computed result, never summed into any
// axis or STATE score. All v4.0 questions, tags, text, and scoring are left
// untouched; new items are appended after each axis's/chapter's existing
// block so no existing array position moves.
//
// Each question carries `modes` (which test length(s) it appears in) and an
// optional `weight` (default 1) — a small number of especially discriminative
// "anchor" questions per axis carry weight 1.5 so they count for more in that
// axis's score without needing a separate scoring path.
//
// Selection criteria applied when narrowing the old ~57-question bank down to
// this set: prefer concrete, timed, or behavior-based questions ("세안 후
// 10분이 지나면...", "하루에 몇 번 수정 화장을 하나요") over vague
// self-assessment ("피부가 민감한가요?", "탄력 관리가 중요한가요?") — the
// latter measure how a person *thinks* about their skin, not what it
// actually does. Cut items were either near-duplicates of a kept question,
// purely attitudinal/priority questions, or lower-signal edge cases.

export const chapters = [
  {
    "id": "morning",
    "title": "아침의 내 피부",
    "label": "유수분 · 기본 반응",
    "emoji": "🌤️",
    "accent": "#B9A7F3",
    "soft": "#F4F0FF",
    "deep": "#8067D7",
    "intro": "하루를 시작할 때 가장 먼저 느껴지는 피부 신호를 살펴봐요."
  },
  {
    "id": "afternoon",
    "title": "오후가 되면",
    "label": "유분 · 속당김 · 메이크업 변화",
    "emoji": "🕒",
    "accent": "#B6DDD0",
    "soft": "#F1FAF7",
    "deep": "#6FB49E",
    "intro": "시간이 지나면서 달라지는 피부의 균형을 확인해볼게요."
  },
  {
    "id": "newproduct",
    "title": "새로운 화장품",
    "label": "민감 반응 · 향 · 회복 속도",
    "emoji": "🧴",
    "accent": "#F1DFA7",
    "soft": "#FFFAEC",
    "deep": "#C7AA54",
    "intro": "처음 만나는 성분과 향에 내 피부가 어떻게 반응하는지 봐요."
  },
  {
    "id": "pores",
    "title": "모공과 트러블",
    "label": "블랙헤드 · 좁쌀 · 막힘",
    "emoji": "🫧",
    "accent": "#F2C1B5",
    "soft": "#FFF5F1",
    "deep": "#D78F7D",
    "intro": "겉으로 보이는 모공보다 반복되는 막힘과 트러블 패턴을 살펴봐요."
  },
  {
    "id": "marks",
    "title": "흔적과 피부톤",
    "label": "색소 · 흔적 · 피부톤",
    "emoji": "✨",
    "accent": "#E8C1D1",
    "soft": "#FFF5F9",
    "deep": "#B88399",
    "intro": "트러블이 지나간 뒤 남는 흔적과 피부톤 변화를 확인해요."
  },
  {
    "id": "heat",
    "title": "햇빛과 더위",
    "label": "열감 · 습도 · 환경 반응",
    "emoji": "☀️",
    "accent": "#F2CE9E",
    "soft": "#FFF8EE",
    "deep": "#D6A362",
    "intro": "더위와 햇빛, 습도에 피부가 얼마나 반응하는지 살펴봐요."
  },
  {
    "id": "tired",
    "title": "탄력과 피로",
    "label": "탄력 · 잔선 · 회복력",
    "emoji": "🌙",
    "accent": "#C4D3EA",
    "soft": "#F3F7FC",
    "deep": "#819DC5",
    "intro": "피곤한 날 드러나는 피부 회복력과 탄력 신호를 살펴봐요."
  },
  {
    "id": "recent",
    "title": "최근의 내 피부",
    "label": "현재 컨디션 · Skin Weather",
    "emoji": "💧",
    "accent": "#CBDDC7",
    "soft": "#F4FAF2",
    "deep": "#8BA884",
    "intro": "마지막으로 요즘 피부 컨디션을 따로 기록해둘게요."
  }
];

const QD = ['quick', 'deep']; // asked in both test lengths
const D = ['deep'];           // deep-only addition

export const questions = [
  // ---- OD (oil/dry) — DEEP 6 / QUICK 5, anchor: post_cleanse (x1.5) ----
  {
    chapter: 'morning', axis: 'OD', state: false, tag: 'post_cleanse', modes: QD, weight: 1.5,
    text: '세안 후 아무것도 바르지 않고 10분이 지나면 가장 가까운 상태는?',
    options: [
      { label: '얼굴 전체가 많이 당긴다', score: -3 },
      { label: '볼이나 입 주변이 당긴다', score: -1 },
      { label: '크게 불편하지 않다', score: 1 },
      { label: '코·이마부터 유분이 느껴진다', score: 3 }
    ]
  },
  {
    chapter: 'morning', axis: 'OD', state: false, tag: 'morning_surface', modes: QD,
    text: '아침에 일어났을 때 피부 표면은 어떤가요?',
    options: [
      { label: '건조하고 푸석하다', score: -3 },
      { label: '볼은 건조하지만 T존은 괜찮다', score: -1 },
      { label: '편안한 편이다', score: 1 },
      { label: '코·이마 또는 얼굴 전체에 유분이 있다', score: 3 }
    ]
  },
  {
    chapter: 'afternoon', axis: 'OD', state: false, tag: 'afternoon_change', modes: QD,
    text: '오후가 되면 가장 먼저 느껴지는 변화는?',
    options: [
      { label: '전체적으로 푸석해진다', score: -3 },
      { label: '볼은 건조하고 T존만 번들거린다', score: 0 },
      { label: '아침과 크게 다르지 않다', score: 1 },
      { label: 'T존이나 얼굴 전체가 번들거린다', score: 3 }
    ]
  },
  {
    chapter: 'afternoon', axis: 'OD', state: false, tag: 'oil_management', modes: QD,
    text: '오후가 되면 코 주변 유분을 닦아내거나 수정 화장을 자주 하나요?',
    options: [
      { label: '거의 하지 않는다', score: -2 },
      { label: '가끔 한다', score: 0 },
      { label: '하루 1번 정도', score: 2 },
      { label: '하루 여러 번 한다', score: 3 }
    ]
  },
  {
    chapter: 'afternoon', axis: 'OD', state: false, tag: 'combo_skin', modes: QD,
    text: '코와 이마는 번들거리는데 볼은 당기는 경우가 있나요?',
    options: [
      { label: '거의 없다', score: -1 },
      { label: '가끔 있다', score: 1 },
      { label: '자주 있다', score: 2 },
      { label: '매우 자주 있다', score: 3 }
    ]
  },
  {
    chapter: 'afternoon', axis: 'OD', state: false, tag: 'makeup_wear', modes: D,
    text: '메이크업이나 선크림을 바른 날 시간이 지나면?',
    options: [
      { label: '들뜨거나 갈라진다', score: -3 },
      { label: '볼·입 주변만 건조해진다', score: -1 },
      { label: '큰 변화가 없다', score: 1 },
      { label: '유분 때문에 쉽게 무너진다', score: 3 }
    ]
  },
  // -- v4.1 additions: seasonal extremity + product-amount dependence, not
  // covered by the time-of-day / behavior-frequency questions above --
  {
    chapter: 'morning', axis: 'OD', state: false, tag: 'seasonal_extremity', modes: D,
    text: '환절기(계절이 바뀔 때) 피부는 어느 쪽으로 더 크게 변하나요?',
    options: [
      { label: '겨울에 심하게 당기고 건조해진다', score: -3 },
      { label: '겨울에 약간 건조한 정도', score: -1 },
      { label: '계절이 바뀌어도 큰 차이가 없다', score: 1 },
      { label: '여름에 유독 유분이 많아진다', score: 3 }
    ]
  },
  {
    chapter: 'morning', axis: 'OD', state: false, tag: 'moisturizer_need', modes: D,
    text: '보습 제품을 얼마나 발라야 피부가 편안하다고 느끼나요?',
    options: [
      { label: '묵직한 크림을 듬뿍 발라도 금방 당긴다', score: -3 },
      { label: '보습제를 넉넉히 발라야 편안하다', score: -1 },
      { label: '적당량이면 무리 없다', score: 1 },
      { label: '가벼운 제품만 발라도 유분기가 남는다', score: 3 }
    ]
  },

  // ---- SR (sensitive/resistant) — DEEP 8 / QUICK 5, anchors: fragrance, fragrance_avoid (x1.5) ----
  {
    chapter: 'newproduct', axis: 'SR', state: false, tag: 'fragrance', modes: QD, weight: 1.5,
    text: '향이 강한 스킨케어 제품을 사용했을 때 피부가 불편해진 적이 있나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '향은 느껴지지만 피부 반응은 없다', score: -1 },
      { label: '가끔 따갑거나 붉어진다', score: 2 },
      { label: '향이 강하면 피부가 쉽게 불편해진다', score: 3 }
    ]
  },
  {
    chapter: 'newproduct', axis: 'SR', state: false, tag: 'fragrance_avoid', modes: QD, weight: 1.5,
    text: '향료나 에센셜오일이 들어간 제품을 피부 때문에 일부러 피하는 편인가요?',
    options: [
      { label: '전혀 아니다', score: -3 },
      { label: '거의 아니다', score: -1 },
      { label: '가끔 피한다', score: 2 },
      { label: '가능하면 피하는 편이다', score: 3 }
    ]
  },
  {
    chapter: 'newproduct', axis: 'SR', state: false, tag: 'alcohol', modes: QD,
    text: '알코올감이 강한 토너나 선제품을 사용하면 따갑거나 건조해지나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 자주', score: 3 }
    ]
  },
  {
    chapter: 'morning', axis: 'SR', state: false, tag: 'cleansing_sensitivity', modes: QD,
    text: '세안 직후 얼굴이 붉어지거나 화끈거리는 편인가요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔 그렇다', score: -1 },
      { label: '자주 그렇다', score: 2 },
      { label: '거의 항상 그렇다', score: 3 }
    ]
  },
  {
    chapter: 'newproduct', axis: 'SR', state: false, tag: 'recovery', modes: QD,
    text: '새 화장품 사용 후 불편함이 생겼다면 보통 얼마나 오래 지속되나요?',
    options: [
      { label: '10분 이내', score: -3 },
      { label: '몇 시간', score: -1 },
      { label: '하루 정도', score: 2 },
      { label: '2일 이상', score: 3 }
    ]
  },
  {
    chapter: 'newproduct', axis: 'SR', state: false, tag: 'friction', modes: D,
    text: '마스크·수건·화장솜처럼 피부에 마찰이 생긴 뒤 쉽게 붉어지나요?',
    options: [
      { label: '거의 아니다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 자주', score: 3 }
    ]
  },
  {
    chapter: 'newproduct', axis: 'SR', state: false, tag: 'environment', modes: D,
    text: '냉난방이 강한 공간이나 건조한 바람에 피부가 쉽게 불편해지나요?',
    options: [
      { label: '거의 아니다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 자주', score: 3 }
    ]
  },
  {
    chapter: 'newproduct', axis: 'SR', state: false, tag: 'behavior', modes: D,
    text: '처음 쓰는 제품을 바로 얼굴 전체에 바르는 것이 부담스럽나요?',
    options: [
      { label: '전혀 아니다', score: -3 },
      { label: '크게 부담 없다', score: -1 },
      { label: '작은 부위부터 써본다', score: 2 },
      { label: '새 제품 자체가 부담스럽다', score: 3 }
    ]
  },

  // ---- PN (pigmentation) — DEEP 6 / QUICK 4, anchor: trouble_mark (x1.5) ----
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'trouble_mark', modes: QD, weight: 1.5,
    text: '트러블이 가라앉은 뒤 갈색이나 어두운 흔적이 남나요?',
    options: [
      { label: '거의 남지 않는다', score: -3 },
      { label: '가끔 남는다', score: -1 },
      { label: '자주 남는다', score: 2 },
      { label: '거의 항상 오래 남는다', score: 3 }
    ]
  },
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'bug_bite_mark', modes: QD,
    text: '벌레에 물리거나 긁힌 자리가 어둡게 남는 편인가요?',
    options: [
      { label: '거의 아니다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 잘 남는다', score: 3 }
    ]
  },
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'sun_darkening', modes: QD,
    text: '햇빛을 많이 받은 뒤 내 피부는?',
    options: [
      { label: '붉었다가 비교적 빨리 돌아온다', score: -3 },
      { label: '약간 어두워진다', score: -1 },
      { label: '쉽게 탄다', score: 2 },
      { label: '어두워진 상태가 오래간다', score: 3 }
    ]
  },
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'fade_speed', modes: QD,
    text: '잡티나 흔적이 생긴 뒤 색이 옅어지는 속도는 어떤가요?',
    options: [
      { label: '비교적 빨리 옅어진다', score: -3 },
      { label: '조금 오래 걸린다', score: -1 },
      { label: '꽤 오래 걸린다', score: 2 },
      { label: '매우 오래 남는 편이다', score: 3 }
    ]
  },
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'wound_discoloration', modes: D,
    text: '작은 상처가 아문 뒤에도 색 변화가 남나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '약간 남는다', score: -1 },
      { label: '꽤 오래 남는다', score: 2 },
      { label: '오래 지속된다', score: 3 }
    ]
  },
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'uneven_tone', modes: D,
    text: '얼굴에 피부톤이 고르지 않은 부분이 눈에 띄나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '약간 있다', score: -1 },
      { label: '꽤 눈에 띈다', score: 2 },
      { label: '가장 큰 고민 중 하나다', score: 3 }
    ]
  },
  // -- v4.1 additions: preventable sunspot formation + friction-induced
  // pigmentation, not covered by the trouble-mark / bite / sun / fade /
  // wound / tone-evenness questions above --
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'sunspot_formation', modes: D,
    text: '자외선 차단을 신경 써도 기미나 잡티가 새로 생기는 편인가요?',
    options: [
      { label: '거의 생기지 않는다', score: -3 },
      { label: '가끔 생긴다', score: -1 },
      { label: '자주 생긴다', score: 2 },
      { label: '차단해도 쉽게 생긴다', score: 3 }
    ]
  },
  {
    chapter: 'marks', axis: 'PN', state: false, tag: 'friction_pigmentation', modes: D,
    text: '속옷 끈, 안경, 마스크 끈처럼 반복적으로 마찰되는 부위가 유독 어둡게 남나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '약간 있다', score: -1 },
      { label: '꽤 눈에 띈다', score: 2 },
      { label: '뚜렷하게 어두운 자국이 남는다', score: 3 }
    ]
  },

  // ---- WT (aging/wrinkle) — DEEP 6 / QUICK 4, anchor: less_firm_vs_past (x1.5) ----
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'fine_lines_static', modes: QD,
    text: '표정을 짓지 않아도 눈가나 입가에 잔선이 보이나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '아주 약간', score: -1 },
      { label: '눈에 띈다', score: 2 },
      { label: '확실히 보인다', score: 3 }
    ]
  },
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'less_firm_vs_past', modes: QD, weight: 1.5,
    text: '몇 년 전보다 피부가 덜 탱탱해졌다고 느끼나요?',
    options: [
      { label: '거의 변화 없다', score: -3 },
      { label: '약간', score: -1 },
      { label: '꽤 그렇다', score: 2 },
      { label: '확실히 그렇다', score: 3 }
    ]
  },
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'sagging', modes: QD,
    text: '볼이나 턱선이 예전보다 처져 보인다고 느끼나요?',
    options: [
      { label: '전혀 아니다', score: -3 },
      { label: '약간', score: -1 },
      { label: '꽤 그렇다', score: 2 },
      { label: '많이 그렇다', score: 3 }
    ]
  },
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'elasticity_press_test', modes: QD,
    text: '피부를 눌렀을 때 예전보다 탄성이 덜하다고 느끼나요?',
    options: [
      { label: '거의 아니다', score: -3 },
      { label: '약간', score: -1 },
      { label: '꽤 그렇다', score: 2 },
      { label: '확실히 그렇다', score: 3 }
    ]
  },
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'sleep_deprived_dullness', modes: D,
    text: '수면이 부족한 날 피부가 유난히 푸석하고 힘없어 보이나요?',
    options: [
      { label: '거의 변화 없다', score: -3 },
      { label: '약간', score: -1 },
      { label: '꽤 그렇다', score: 2 },
      { label: '매우 그렇다', score: 3 }
    ]
  },
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'recovery_speed', modes: D,
    text: '피부가 피곤해 보인 뒤 원래 컨디션으로 돌아오는 속도는?',
    options: [
      { label: '빠른 편', score: -3 },
      { label: '하루 정도', score: -1 },
      { label: '이틀 이상', score: 2 },
      { label: '쉽게 회복되지 않는다', score: 3 }
    ]
  },
  // -- v4.1 additions: dynamic-wrinkle recovery + volume loss, not covered
  // by the static-line / sagging / press-test / dullness / recovery-speed
  // questions above --
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'dynamic_line_recovery', modes: D,
    text: '웃거나 찡그린 후 표정을 풀면 주름이 사라지는 데 얼마나 걸리나요?',
    options: [
      { label: '바로 사라진다', score: -3 },
      { label: '몇 초 내로 사라진다', score: -1 },
      { label: '꽤 오래 남아있다', score: 2 },
      { label: '표정을 풀어도 자국처럼 남는다', score: 3 }
    ]
  },
  {
    chapter: 'tired', axis: 'WT', state: false, tag: 'volume_loss', modes: D,
    text: '체중 변화와 관계없이, 얼굴(볼·관자놀이)의 볼륨이 자연스럽게 꺼지거나 처지는 느낌이 드나요?',
    options: [
      { label: '전혀 아니다', score: -3 },
      { label: '약간', score: -1 },
      { label: '꽤 그렇다', score: 2 },
      { label: '확실히 홀쭉해졌다', score: 3 }
    ]
  },

  // ---- CB (congested/balanced) — DEEP-only, 6 questions, anchor: whiteheads (x1.5) ----
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'comedone_touch', modes: D,
    text: '코나 턱을 만졌을 때 오돌토돌한 느낌이 있나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '거의 항상', score: 3 }
    ]
  },
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'whiteheads', modes: D, weight: 1.5,
    text: '화이트헤드나 좁쌀이 생기는 편인가요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 자주', score: 3 }
    ]
  },
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'blackhead_recurrence', modes: D,
    text: '블랙헤드를 관리해도 쉽게 다시 눈에 띄나요?',
    options: [
      { label: '거의 아니다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 빠르게 다시 생긴다', score: 3 }
    ]
  },
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'heavy_cream_reaction', modes: D,
    text: '무거운 크림이나 오일을 충분히 바르면?',
    options: [
      { label: '피부가 더 편안하다', score: -3 },
      { label: '별 차이 없다', score: -1 },
      { label: '답답할 때가 있다', score: 2 },
      { label: '좁쌀이나 트러블이 잘 생긴다', score: 3 }
    ]
  },
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'makeup_days_pore_clog', modes: D,
    text: '선크림이나 메이크업을 며칠 연속 사용하면?',
    options: [
      { label: '특별한 변화 없다', score: -3 },
      { label: '약간 답답하다', score: -1 },
      { label: '모공이 막히는 느낌이 든다', score: 2 },
      { label: '트러블이 쉽게 생긴다', score: 3 }
    ]
  },
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'stress_sleep_breakout', modes: D,
    text: '스트레스나 수면 부족 후 모공막힘이나 트러블이 늘어나나요?',
    options: [
      { label: '거의 변화 없다', score: -3 },
      { label: '약간 늘어난다', score: -1 },
      { label: '확실히 늘어난다', score: 2 },
      { label: '매우 심해진다', score: 3 }
    ]
  },
  // -- v4.1 additions: inflammatory breakouts + active-lesion duration, not
  // covered by the six comedonal/occlusion-focused questions above --
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'inflamed_breakout', modes: D,
    text: '붉고 아프게 부어오르는 염증성 트러블(뾰루지)이 생기는 편인가요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔 생긴다', score: -1 },
      { label: '자주 생긴다', score: 2 },
      { label: '매우 자주, 크게 생긴다', score: 3 }
    ]
  },
  {
    chapter: 'pores', axis: 'CB', state: false, tag: 'breakout_duration', modes: D,
    text: '트러블이 생기면 붓기와 통증이 가라앉기까지 보통 얼마나 걸리나요? (색이 남는 흔적은 제외하고 답해주세요)',
    options: [
      { label: '2~3일 이내', score: -3 },
      { label: '일주일 정도', score: -1 },
      { label: '1~2주 이상', score: 2 },
      { label: '한 달 가까이 지속되기도 한다', score: 3 }
    ]
  },

  // ---- HQ (heat-reactive/quiet) — DEEP-only, 6 questions, anchor: heat_face_flush (x1.5) ----
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'heat_face_flush', modes: D, weight: 1.5,
    text: '더운 곳에 오래 있으면 얼굴이 쉽게 뜨거워지나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 자주', score: 3 }
    ]
  },
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'exercise_flush_duration', modes: D,
    text: '운동 후 얼굴의 열감이나 붉음은 얼마나 지속되나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '10분 이내', score: -1 },
      { label: '10~30분', score: 2 },
      { label: '30분 이상', score: 3 }
    ]
  },
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'sun_heat_discomfort', modes: D,
    text: '강한 햇빛을 받은 뒤 피부가 뜨겁거나 불편하게 느껴지나요?',
    options: [
      { label: '거의 아니다', score: -3 },
      { label: '약간', score: -1 },
      { label: '꽤 그렇다', score: 2 },
      { label: '매우 그렇다', score: 3 }
    ]
  },
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'humid_weather_response', modes: D,
    text: '덥고 습한 날 피부는?',
    options: [
      { label: '오히려 편안하다', score: -3 },
      { label: '큰 변화 없다', score: -1 },
      { label: '유분과 답답함이 늘어난다', score: 2 },
      { label: '열감·붉음·트러블이 확실히 늘어난다', score: 3 }
    ]
  },
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'spicy_food_flush', modes: D,
    text: '매운 음식이나 뜨거운 음식을 먹으면 얼굴이 붉어지나요?',
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 자주', score: 3 }
    ]
  },
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'mask_ventilation_discomfort', modes: D,
    text: '마스크를 오래 쓰거나 환기가 안 되는 곳에 있으면?',
    options: [
      { label: '거의 변화 없다', score: -3 },
      { label: '조금 불편하다', score: -1 },
      { label: '뜨겁고 답답하다', score: 2 },
      { label: '피부 컨디션이 확실히 나빠진다', score: 3 }
    ]
  },
  // -- v4.1 additions: cold/temperature-swing reaction + persistent (non-
  // triggered) flush, not covered by the six heat-trigger questions above,
  // which are all about heat exposure specifically --
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'cold_transition_reaction', modes: D,
    text: "실내외를 오갈 때 온도가 갑자기 바뀌면 얼굴이 붉어지거나 화끈거리는 '일시적 홍조'가 나타나나요? (건조함·따가움이 아니라 붉어짐·열감 자체를 기준으로 답해주세요)",
    options: [
      { label: '거의 없다', score: -3 },
      { label: '가끔', score: -1 },
      { label: '자주', score: 2 },
      { label: '매우 자주, 눈에 띄게', score: 3 }
    ]
  },
  {
    chapter: 'heat', axis: 'HQ', state: false, tag: 'persistent_flush', modes: D,
    text: '특별한 자극이 없어도 평소 볼이나 코 주변에 붉은기가 남아있는 편인가요?',
    options: [
      { label: '전혀 아니다', score: -3 },
      { label: '약간 있다', score: -1 },
      { label: '꽤 뚜렷하다', score: 2 },
      { label: '항상 붉은기가 있다', score: 3 }
    ]
  },

  // ---- STATE (recent condition, not part of TYPE scoring) — DEEP-only bonus chapter ----
  {
    chapter: 'recent', axis: 'sleep', state: true, tag: 'sleep', modes: D,
    text: '최근 3일 동안 수면은 어땠나요?',
    options: [
      { label: '충분했다', score: 0 },
      { label: '조금 부족했다', score: 1 },
      { label: '많이 부족했다', score: 2 }
    ]
  },
  {
    chapter: 'recent', axis: 'dehydration', state: true, tag: 'dehydration', modes: D,
    text: '최근 1주일 피부 당김은?',
    options: [
      { label: '평소와 비슷하다', score: 0 },
      { label: '조금 심해졌다', score: 1 },
      { label: '많이 심해졌다', score: 2 }
    ]
  },
  {
    chapter: 'recent', axis: 'trouble', state: true, tag: 'trouble', modes: D,
    text: '최근 1주일 트러블은?',
    options: [
      { label: '평소와 비슷하다', score: 0 },
      { label: '조금 늘었다', score: 1 },
      { label: '많이 늘었다', score: 2 }
    ]
  },
  {
    chapter: 'recent', axis: 'heat', state: true, tag: 'heat', modes: D,
    text: '오늘 얼굴의 열감은?',
    options: [
      { label: '편안하다', score: 0 },
      { label: '약간 따뜻하다', score: 1 },
      { label: '꽤 뜨겁다', score: 2 },
      { label: '화끈거리고 불편하다', score: 3 }
    ]
  },
  {
    chapter: 'recent', axis: 'stress', state: true, tag: 'stress', modes: D,
    text: '최근 스트레스 정도는?',
    options: [
      { label: '낮다', score: 0 },
      { label: '보통', score: 1 },
      { label: '높다', score: 2 },
      { label: '매우 높다', score: 3 }
    ]
  },
  {
    chapter: 'recent', axis: 'new_product', state: true, tag: 'new_product', modes: D,
    text: '최근 2주 안에 새로운 화장품을 사용했나요?',
    options: [
      { label: '아니다', score: 0 },
      { label: '1개 정도', score: 1 },
      { label: '2~3개', score: 2 },
      { label: '여러 제품을 바꿨다', score: 3 }
    ]
  },
  // -- v4.1 addition: current skin texture, not covered by the six existing
  // STATE questions (sleep/dehydration/trouble/heat/stress/new_product) --
  {
    chapter: 'recent', axis: 'texture', state: true, tag: 'texture', modes: D,
    text: '요즘 피부결(까칠함·각질)은 어떤가요?',
    options: [
      { label: '매끄럽다', score: 0 },
      { label: '약간 까칠하다', score: 1 },
      { label: '꽤 까칠하다', score: 2 },
      { label: '각질이 심하게 일어난다', score: 3 }
    ]
  },

  // ---- Validation (self-perception reference only — v4.1, revised to a
  // multi-select so it never forces a single-axis choice) ----
  // `validationOnly: true` is the explicit flag App.jsx's scoring loop
  // checks first and skips entirely: this question never contributes to
  // any TYPE axis sum/weight or to the STATE `weather` object, no matter
  // what `axis`/`state` are set to. `multiSelect: true` tells the DEEP
  // quiz UI to store an array of selected option indices in `answers`
  // instead of a single index, and to let several be picked at once. The
  // two `exclusive: true` options ("특별히 없음"/"잘 모르겠어요") are kept
  // mutually exclusive with every other option by the UI's selection
  // logic, not by any scoring code — this question exists purely so the
  // result can later be compared against how the user already sees
  // themselves; it is still saved like any other answer inside the raw
  // `answers` blob (as an array here, same as everywhere else).
  {
    chapter: 'recent', axis: null, state: false, validationOnly: true, multiSelect: true, tag: 'self_perceived_type', modes: D,
    text: '평소 내 피부에 해당한다고 느끼는 특징을 모두 골라주세요. (참고용이며 진단 결과 점수에는 반영되지 않아요)',
    options: [
      { label: '건조하거나 당김이 느껴지는 편이에요', score: 0 },
      { label: '유분이 많이 올라오는 편이에요', score: 1 },
      { label: '피부가 쉽게 민감해지거나 따가운 편이에요', score: 2 },
      { label: '잡티나 트러블 흔적이 잘 남는 편이에요', score: 3 },
      { label: '주름이나 탄력 저하가 고민이에요', score: 4 },
      { label: '모공이 잘 막히거나 트러블이 생기는 편이에요', score: 5 },
      { label: '열감이나 붉어짐이 쉽게 나타나는 편이에요', score: 6 },
      { label: '특별히 떠오르는 특징이 없어요', score: 7, exclusive: true },
      { label: '잘 모르겠어요', score: 8, exclusive: true }
    ]
  }
];
