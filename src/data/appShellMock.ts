import { SELF_PROVIDER_ID } from './mock';

export type FeedPost = {
  id: string;
  title: string;
  coverGradient: string;
  coverHeight: number;
  authorName: string;
  authorColor: string;
  likeCount: number;
  momentSignal?: string;
  providerId?: string;
};

export const feedPosts: FeedPost[] = [
  {
    id: 'f1',
    title: '周末的落日海岸线，风都是暖的',
    coverGradient: 'linear-gradient(160deg, #ffd9a0, #ff9d76)',
    coverHeight: 210,
    authorName: 'Aurora',
    authorColor: '#3DB8A0',
    likeCount: 328,
    momentSignal: '可约 Moment',
    providerId: 'p-aurora',
  },
  {
    id: 'f2',
    title: '新歌 demo 试听片段，欢迎来评论区',
    coverGradient: 'linear-gradient(160deg, #a8c8ff, #6f9bf0)',
    coverHeight: 160,
    authorName: 'Nova',
    authorColor: '#4A7FD4',
    likeCount: 512,
    momentSignal: '有档期',
    providerId: 'p-nova',
  },
  {
    id: 'f3',
    title: '今天的手冲咖啡拉花练习，进步了一点点',
    coverGradient: 'linear-gradient(160deg, #d9c3a8, #a98868)',
    coverHeight: 190,
    authorName: '小柚',
    authorColor: '#E0A050',
    likeCount: 96,
    momentSignal: '开放中',
    providerId: 'p-aurora',
  },
  {
    id: 'f4',
    title: '开黑车队集合！今晚八点老地方',
    coverGradient: 'linear-gradient(160deg, #b8e6d0, #6fc7a4)',
    coverHeight: 150,
    authorName: '阿哲',
    authorColor: '#5A9E8C',
    likeCount: 204,
  },
  {
    id: 'f5',
    title: '城市夜跑第 42 天，打卡江边步道',
    coverGradient: 'linear-gradient(160deg, #c7b8f0, #8f7ad6)',
    coverHeight: 200,
    authorName: '一格',
    authorColor: '#7A68C0',
    likeCount: 158,
    momentSignal: '可约 Moment',
    providerId: 'p-nova',
  },
  {
    id: 'f6',
    title: '手帐分享 | 十月的碎片都收在这里了',
    coverGradient: 'linear-gradient(160deg, #f5c3d0, #e08aa8)',
    coverHeight: 170,
    authorName: '桃桃',
    authorColor: '#D06888',
    likeCount: 441,
  },
  {
    id: 'f7',
    title: '耳机里的白噪声，适合写一天的总结',
    coverGradient: 'linear-gradient(160deg, #9fd4c8, #4adcc4)',
    coverHeight: 185,
    authorName: '玛薯',
    authorColor: '#4ADCC4',
    likeCount: 88,
    momentSignal: '开放中',
    providerId: SELF_PROVIDER_ID,
  },
  {
    id: 'f8',
    title: '楼下新开的花店，路过拍一张',
    coverGradient: 'linear-gradient(160deg, #f0d4a8, #e8a878)',
    coverHeight: 155,
    authorName: 'Nova',
    authorColor: '#4A7FD4',
    likeCount: 210,
    momentSignal: '有档期',
    providerId: 'p-nova',
  },
];

export type Conversation = {
  id: string;
  kind: 'private' | 'group';
  subtype?: 'activity';
  name: string;
  avatarColor: string;
  preview: string;
  time: string;
  unread: number;
  to?: string;
};

/** 图2 演示 mock：活动群 + Aurora + Nova + 周五开黑车队 */
export const demoMessageConversations: Conversation[] = [
  {
    id: 'ag-g-boardgame',
    kind: 'group',
    subtype: 'activity',
    name: '周末桌游局 · 狼人杀 · 周六 19:30',
    avatarColor: '#E8A05A',
    preview: '[组局] 周六 19:30 · 静安桌游吧',
    time: '刚刚',
    unread: 1,
    to: '/messages/chat/ag-g-boardgame',
  },
  {
    id: 'c1',
    kind: 'private',
    name: 'Aurora',
    avatarColor: '#3DB8A0',
    preview: '[预约] 周五 20:00 · 语音专属',
    time: '10:24',
    unread: 2,
    to: '/messages/dm/p-aurora',
  },
  {
    id: 'c2',
    kind: 'private',
    name: 'Nova',
    avatarColor: '#4A7FD4',
    preview: '[预约] 视频档期已确认',
    time: '09:51',
    unread: 0,
    to: '/messages/dm/p-nova',
  },
  {
    id: 'c-kira',
    kind: 'private',
    name: 'Kira',
    avatarColor: '#7B6CF6',
    preview: '[陪玩] 今晚可约 · 瓦罗兰特',
    time: '08:12',
    unread: 0,
    to: '/messages/dm/p-kira',
  },
  {
    id: 'c3-gaming',
    kind: 'group',
    name: '周五开黑车队',
    avatarColor: '#5A9E8C',
    preview: '阿哲：今晚八点集合，别迟到',
    time: '昨天',
    unread: 5,
    to: '/messages/chat/c3-gaming',
  },
];

export const conversations: Conversation[] = [
  {
    id: 'c1',
    kind: 'private',
    name: 'Aurora',
    avatarColor: '#3DB8A0',
    preview: '预约成功，周五 20:00 等你哦',
    time: '10:24',
    unread: 2,
  },
  {
    id: 'c2',
    kind: 'private',
    name: 'Nova',
    avatarColor: '#4A7FD4',
    preview: '视频档期已确认，到点进等待室就行',
    time: '09:51',
    unread: 0,
  },
  {
    id: 'c3',
    kind: 'group',
    name: '周五开黑车队',
    avatarColor: '#5A9E8C',
    preview: '阿哲：今晚八点集合，别迟到',
    time: '昨天',
    unread: 5,
  },
  {
    id: 'c4',
    kind: 'private',
    name: '小柚',
    avatarColor: '#E0A050',
    preview: '好呀好呀，那就这么说定了',
    time: '昨天',
    unread: 0,
  },
  {
    id: 'c5',
    kind: 'group',
    name: '露营组局群',
    avatarColor: '#7A68C0',
    preview: '桃桃：装备清单我整理好发群里了',
    time: '周三',
    unread: 0,
  },
  {
    id: 'c6',
    kind: 'private',
    name: '系统通知',
    avatarColor: '#98A2B3',
    preview: '你的订单已完成，可前往查看',
    time: '周三',
    unread: 1,
  },
];

export const chatShortcuts = [
  { id: 's1', label: '任务中心', color: '#4ADCC4', icon: '任' },
  { id: 's2', label: '新增粉丝', color: '#6F9BF0', icon: '粉' },
  { id: 's3', label: '赞和收藏', color: '#F0A06F', icon: '赞' },
  { id: 's4', label: '评论和@', color: '#B08AE0', icon: '评' },
];

export const myProfile = {
  name: '玛薯',
  title: '初级探索者',
  bio: '在 MAXU 记录生活，也预约喜欢的专属时刻。',
  maxuId: '77291024',
  ipLocation: 'IP 属地：上海',
  following: 128,
  followers: 56,
  likes: 342,
  avatarColor: '#4ADCC4',
};

export type ProfilePost = {
  id: string;
  title: string;
  coverGradient: string;
  coverHeight: number;
  likeCount: number;
};

export const myPosts: ProfilePost[] = [
  {
    id: 'mp1',
    title: '第一次尝试胶片扫描，颗粒感好棒',
    coverGradient: 'linear-gradient(160deg, #c8d8c0, #90b088)',
    coverHeight: 180,
    likeCount: 45,
  },
  {
    id: 'mp2',
    title: '周末书店的一角',
    coverGradient: 'linear-gradient(160deg, #e0d0b8, #c0a880)',
    coverHeight: 150,
    likeCount: 23,
  },
  {
    id: 'mp3',
    title: '雨天窗边随手拍',
    coverGradient: 'linear-gradient(160deg, #b0c4d8, #7890b0)',
    coverHeight: 200,
    likeCount: 67,
  },
  {
    id: 'mp4',
    title: '晚饭后的散步路线',
    coverGradient: 'linear-gradient(160deg, #f0c8c0, #d09088)',
    coverHeight: 160,
    likeCount: 31,
  },
];
