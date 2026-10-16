import type { Settings, StoryItem } from '@/lib/types';

/**
 * Seed values for the single `settings` row and the My story timeline.
 * Used to seed Supabase, and as a read-only fallback when Supabase isn't configured.
 * The phone/WhatsApp number is a placeholder — Romany sets the real one in Admin → Settings.
 */
export const seedSettings: Settings = {
  consultantName: 'Romany',
  consultantNameAr: 'روماني',
  title: 'Your property consultant in Cairo',
  titleAr: 'مستشارك العقاري في القاهرة',
  portraitPath: '/romany-portrait.jpg',
  avatarPath: '/romany-avatar.jpg',
  phone: '201000000000',
  whatsapp: '201000000000',
  email: null,
  hours: 'Saturday – Thursday · 11 am – 9 pm',
  hoursAr: 'السبت – الخميس · ١١ صباحًا – ٩ مساءً',
  openDays: [6, 0, 1, 2, 3, 4],
  openFrom: 11,
  openTo: 21,
  available: true,
  areas: ['New Cairo', 'New Capital', '6th of October', 'North Coast'],
  areasAr: ['القاهرة الجديدة', 'العاصمة الإدارية', '٦ أكتوبر', 'الساحل الشمالي'],
  social: {},
  storyIntro:
    "I grew up in Cairo watching my parents save for years for their first apartment — and worry over every line of the contract. Today I help families make that same step with clear numbers and far less stress. I only show homes I'd recommend to my own family, and I'm still a phone call away long after the keys are handed over.",
  storyIntroAr:
    'كبرت في القاهرة وأنا أرى والديّ يدّخران لسنوات من أجل أول شقة لهما — ويقلقان من كل سطر في العقد. اليوم أساعد العائلات على اتخاذ نفس الخطوة بأرقام واضحة وقلق أقل بكثير. لا أعرض إلا بيوتًا أنصح بها عائلتي، وأظل على بُعد مكالمة حتى بعد تسليم المفاتيح بوقت طويل.',
  quote:
    "I don't sell units. I help families choose where their next ten years happen — and I tell them honestly when a place isn't right.",
  quoteAr: 'أنا لا أبيع وحدات. أنا أساعد العائلات على اختيار المكان الذي ستعيش فيه سنواتها العشر القادمة — وأقول لهم بصراحة عندما لا يكون المكان مناسبًا.',
};

export const seedStory: StoryItem[] = [
  {
    id: 'story-2019',
    year: '2019',
    title: 'Where it began',
    titleAr: 'البداية',
    text: "My first sale: a young couple's two-bedroom in New Cairo. Seeing their faces at handover is why I stayed.",
    textAr: 'أول بيعة لي: شقة بغرفتين لزوجين شابين في القاهرة الجديدة. رؤية وجوههما يوم الاستلام هي سبب بقائي في هذا العمل.',
    sort: 1,
  },
  {
    id: 'story-2021',
    year: '2021',
    title: 'New launches & payment plans',
    titleAr: 'المشروعات الجديدة وخطط السداد',
    text: 'Began advising on off-plan launches in New Cairo and the New Capital — and explaining long instalment plans in plain words.',
    textAr: 'بدأت أقدّم المشورة في مشروعات الإطلاق الجديدة في القاهرة الجديدة والعاصمة الإدارية — وأشرح خطط التقسيط الطويلة بكلمات بسيطة.',
    sort: 2,
  },
  {
    id: 'story-2023',
    year: '2023',
    title: 'Homes by the sea',
    titleAr: 'بيوت على البحر',
    text: 'Added North Coast summer homes in Ras El Hekma and Al Dabaa for families who wanted a second home.',
    textAr: 'أضفت بيوت الساحل الشمالي الصيفية في رأس الحكمة والضبعة للعائلات التي تريد بيتًا ثانيًا.',
    sort: 3,
  },
  {
    id: 'story-today',
    year: 'Today',
    title: 'Your consultant, one-to-one',
    titleAr: 'مستشارك، وجهًا لوجه',
    text: 'Advising families across New Cairo, the New Capital, 6th of October, Sheikh Zayed and the North Coast.',
    textAr: 'أقدّم المشورة للعائلات في القاهرة الجديدة والعاصمة الإدارية و٦ أكتوبر والشيخ زايد والساحل الشمالي.',
    sort: 4,
  },
];
