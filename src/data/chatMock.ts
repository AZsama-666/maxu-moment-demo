export type BookingCardVariant = 'moment' | 'group' | 'companion';

export type BookingCardPayload = {
  variant: BookingCardVariant;
  title: string;
  subtitle?: string;
  whenLabel: string;
  placeLabel?: string;
  statusLabel: string;
  priceYuan?: number;
  primaryCta: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
};

export type ChatMessage =
  | {
      id: string;
      kind: 'text';
      senderName?: string;
      align?: 'left' | 'system';
      text: string;
    }
  | {
      id: string;
      kind: 'booking_card';
      align?: 'left' | 'system';
      card: BookingCardPayload;
    };

export const auroraMomentCard: BookingCardPayload = {
  variant: 'moment',
  title: '60 秒语音专属时刻',
  subtitle: '供给方 Aurora',
  whenLabel: '周五 20:00',
  statusLabel: '已预约 · 待履约',
  priceYuan: 9.9,
  primaryCta: { label: '进入等待室', to: '/profile/orders' },
  secondaryCta: { label: '查看订单', to: '/profile/orders' },
};

export const novaMomentCard: BookingCardPayload = {
  variant: 'moment',
  title: '60 秒视频专属时刻',
  subtitle: '供给方 Nova',
  whenLabel: '周日 16:00',
  statusLabel: '已预约 · 待履约',
  priceYuan: 19.9,
  primaryCta: { label: '进入等待室', to: '/profile/orders' },
  secondaryCta: { label: '查看订单', to: '/profile/orders' },
};

export const boardgameGroupCard: BookingCardPayload = {
  variant: 'group',
  title: '周末桌游局 · 狼人杀',
  subtitle: '主理人 阿哲',
  whenLabel: '周六 19:30',
  placeLabel: '静安 · 桌游吧',
  statusLabel: '招募中 · 可报名',
  priceYuan: 68,
  primaryCta: { label: '查看活动', to: '/group/g-boardgame' },
  secondaryCta: { label: '咨询主理人', to: '/messages/dm/p-azhe' },
};

export const kiraCompanionCard: BookingCardPayload = {
  variant: 'companion',
  title: '瓦罗兰特上分陪玩',
  subtitle: '供给方 Kira',
  whenLabel: '今晚可约',
  placeLabel: '线上开黑',
  statusLabel: '待双方确认',
  priceYuan: 39,
  primaryCta: { label: '查看订单', to: '/profile/orders' },
  secondaryCta: { label: '联系 Kira', to: '/messages/dm/p-kira' },
};

export const dmChatMessages: Record<string, ChatMessage[]> = {
  'p-aurora': [
    {
      id: 'aurora-card',
      kind: 'booking_card',
      align: 'system',
      card: auroraMomentCard,
    },
    {
      id: 'aurora-text',
      kind: 'text',
      senderName: 'Aurora',
      text: '预约成功，周五 20:00 等你哦',
    },
  ],
  'p-nova': [
    {
      id: 'nova-card',
      kind: 'booking_card',
      align: 'system',
      card: novaMomentCard,
    },
    {
      id: 'nova-text',
      kind: 'text',
      senderName: 'Nova',
      text: '视频档期已确认，到点进等待室就行',
    },
  ],
  'p-azhe': [
    {
      id: 'azhe-text',
      kind: 'text',
      senderName: '阿哲',
      text: '你好，想了解活动哪方面？时间地点或费用都可以问我。',
    },
  ],
  'p-kira': [
    {
      id: 'kira-card',
      kind: 'booking_card',
      align: 'system',
      card: kiraCompanionCard,
    },
    {
      id: 'kira-text',
      kind: 'text',
      senderName: 'Kira',
      text: '今晚有空，需要的话直接下单或在这里问我。',
    },
  ],
};

export const groupChatMessages: Record<string, ChatMessage[]> = {
  'ag-g-boardgame': [
    {
      id: 'bg-card',
      kind: 'booking_card',
      align: 'system',
      card: boardgameGroupCard,
    },
    {
      id: 'bg-sys',
      kind: 'text',
      align: 'system',
      text: '活动群已创建。主理人可在群内发布集合信息与注意事项。',
    },
    {
      id: 'bg-host',
      kind: 'text',
      senderName: '阿哲',
      text: '大家好，欢迎加入！有任何问题可以在群里问，也支持私聊我。',
    },
  ],
  'c3-gaming': [
    {
      id: 'gm-host',
      kind: 'text',
      senderName: '阿哲',
      text: '今晚八点集合，别迟到',
    },
  ],
};

export function getDmChatMessages(providerId: string): ChatMessage[] {
  return dmChatMessages[providerId] ?? [];
}

export function getGroupChatMessages(chatId: string): ChatMessage[] {
  return groupChatMessages[chatId] ?? [];
}

export function bookingCardVariantLabel(variant: BookingCardVariant): string {
  switch (variant) {
    case 'moment':
      return '1V1';
    case 'group':
      return '组局';
    case 'companion':
      return '陪玩';
  }
}
