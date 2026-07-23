import type {
  GroupContentSection,
  GroupRefundPolicy,
} from './marketMock';

export const GROUP_SELF_LISTING_ID = 'g-self-werewolf';

export type GroupDemoPreset = {
  title: string;
  description: string;
  intro: string;
  whenLabel: string;
  placeLabel: string;
  priceYuan: number;
  seats: number;
  coverImageUrl: string;
  hostBadge: string;
  hostOrganizedCount: number;
  hostIntro: string;
  hostWechatId: string;
  joinNoteTemplate: string;
  refundPolicy: GroupRefundPolicy;
  contentSections: GroupContentSection[];
};

/** Demo 预填：周末桌游局 · 狼人杀（内容对齐 g-boardgame，主理人为玛薯） */
export const GROUP_WEREWOLF_DEMO_PRESET: GroupDemoPreset = {
  title: '周末桌游局 · 狼人杀',
  description:
    '线下组局，到场后双方在 App 内确认收货交割。平台不代履约通话，仅协助撮合与确认。',
  intro:
    '周末放松的小型狼人杀局，新手友好、规则会现场讲解。6–8 人小局，氛围轻松不尬聊，适合想认识同城桌游爱好者的你。',
  whenLabel: '周六 19:30',
  placeLabel: '静安 · 桌游吧',
  priceYuan: 68,
  seats: 8,
  coverImageUrl: '/covers/g-boardgame-cover.png',
  hostBadge: '已认证主理',
  hostOrganizedCount: 12,
  hostIntro:
    '在 MAXU 组织线下桌游局，专注 6–10 人小型狼人杀。已成功举办 12 场，新手友好、规则清晰，欢迎新手加入。',
  hostWechatId: 'maxu_boardgame',
  joinNoteTemplate: '昵称+手机号',
  refundPolicy: {
    fullRefundHoursBefore: 24,
    partialRefundHoursBefore: 24,
    partialRefundPenaltyPercent: 50,
    noShowNote: '当日未到视为放弃，不予退款',
  },
  contentSections: [
    {
      title: '活动流程',
      body: '19:30 集合签到\n20:00 规则讲解与分组\n20:15–22:00 狼人杀 2–3 局\n22:00 后自由交流，可提前离场',
    },
    {
      title: '费用说明',
      body: '¥68 含桌游吧场地费与基础饮品（可乐/茶水）。不含晚餐，可自带小零食与他人分享。',
    },
    {
      title: '注意事项',
      body: '请准时到场，迟到超过 30 分钟可能无法加入当局。\n文明游戏，禁止贴脸、场外沟通或恶意剧透。\n尊重不同水平玩家，新手局以体验为先。',
    },
    {
      title: '退改政策',
      body: '活动开始前 24 小时取消，全额退款。\n24 小时内取消，扣除 50% 作为场地占位费。\n当日未到视为放弃，不予退款。',
    },
  ],
};
