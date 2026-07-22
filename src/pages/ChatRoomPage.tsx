import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ChatBookingCard } from '../components/ChatBookingCard';
import { getProvider } from '../data/catalog';
import {
  boardgameGroupCard,
  getDmChatMessages,
  getGroupChatMessages,
  type ChatMessage,
} from '../data/chatMock';
import { getGroupListing } from '../data/marketMock';
import {
  activityGroupIdForListing,
  getActivityGroup,
  useActivityGroups,
} from '../state/activityGroupStore';

function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <>
      {messages.map((msg) => {
        if (msg.kind === 'booking_card') {
          return (
            <div
              key={msg.id}
              className={`chat-message-row ${
                msg.align === 'system' ? 'chat-message-row--system' : ''
              }`}
            >
              <ChatBookingCard card={msg.card} />
            </div>
          );
        }

        if (msg.align === 'system') {
          return (
            <div key={msg.id} className="chat-system-msg">
              {msg.text}
            </div>
          );
        }

        return (
          <div key={msg.id} className="chat-bubble chat-bubble--other">
            {msg.senderName && (
              <span className="chat-bubble__name">{msg.senderName}</span>
            )}
            <p>{msg.text}</p>
          </div>
        );
      })}
    </>
  );
}

function ChatRoomShell({
  title,
  subtitle,
  backTo = '/messages',
  headerAction,
  meta,
  messages,
  hint,
  composePlaceholder,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  headerAction?: ReactNode;
  meta?: ReactNode;
  messages: ChatMessage[];
  hint?: string;
  composePlaceholder: string;
}) {
  return (
    <div className="page page--chat-room">
      <header className="chat-room-header">
        <Link to={backTo} className="chat-room-header__back" aria-label="返回">
          ‹
        </Link>
        <div className="chat-room-header__title">
          <strong>{title}</strong>
          {subtitle && <span className="muted">{subtitle}</span>}
        </div>
        {headerAction ?? <span className="chat-room-header__spacer" />}
      </header>

      {meta}

      <div className="chat-room-messages">
        <ChatMessageList messages={messages} />
        {hint && <p className="chat-room-hint muted">{hint}</p>}
      </div>

      <div className="chat-room-compose">
        <input type="text" placeholder={composePlaceholder} disabled />
        <button type="button" className="btn btn--primary" disabled>
          发送
        </button>
      </div>
    </div>
  );
}

export function ChatRoomPage() {
  useActivityGroups();
  const { chatId = '', providerId = '' } = useParams();

  if (providerId) {
    const host = getProvider(providerId);
    if (!host) {
      return (
        <div className="page">
          <header className="chat-room-header">
            <Link to="/messages" className="chat-room-header__back" aria-label="返回">
              ‹
            </Link>
            <h1>私聊</h1>
            <span className="chat-room-header__spacer" />
          </header>
          <p className="empty">用户不存在</p>
        </div>
      );
    }

    const messages = getDmChatMessages(providerId);

    return (
      <ChatRoomShell
        title={host.name}
        subtitle="私聊"
        headerAction={
          <Link to={`/ta/${host.id}`} className="text-link chat-room-header__action">
            TA 主页
          </Link>
        }
        messages={messages}
        hint="Demo 私聊：预约/订单以卡片形式展示，可一键进入订单或等待室。"
        composePlaceholder="输入消息…"
      />
    );
  }

  if (chatId === 'ag-g-boardgame' || chatId === 'c3-gaming') {
    const isBoardgame = chatId === 'ag-g-boardgame';
    return (
      <ChatRoomShell
        title={
          isBoardgame
            ? '周末桌游局 · 狼人杀 · 周六 19:30'
            : '周五开黑车队'
        }
        subtitle={isBoardgame ? '活动群 · 招募中' : '群聊'}
        messages={getGroupChatMessages(chatId)}
        hint={isBoardgame ? 'Demo 活动群：组局订单以卡片展示。' : 'Demo 群聊占位。'}
        composePlaceholder="发消息到活动群…"
      />
    );
  }

  const group = getActivityGroup(chatId);
  if (!group) {
    const listingId = chatId.replace(/^ag-/, '');
    const listing = getGroupListing(listingId);
    if (listing && chatId === activityGroupIdForListing(listingId)) {
      const messages: ChatMessage[] = [
        {
          id: 'paid-group-card',
          kind: 'booking_card',
          align: 'system',
          card: {
            ...boardgameGroupCard,
            title: listing.title,
            subtitle: `主理人 ${listing.hostName}`,
            whenLabel: listing.whenLabel,
            placeLabel: listing.placeLabel,
            statusLabel: '已支付 · 待确认',
            priceYuan: listing.priceYuan,
            primaryCta: {
              label: '进入活动群',
              to: `/messages/chat/${chatId}`,
            },
            secondaryCta: {
              label: '查看活动',
              to: `/group/${listing.id}`,
            },
          },
        },
        ...getGroupChatMessages('ag-g-boardgame').filter((m) => m.kind === 'text'),
      ];

      return (
        <ChatRoomShell
          title={`${listing.title} · ${listing.whenLabel}`}
          subtitle="活动群 · 招募中"
          messages={messages}
          hint="Demo 活动群占位。付款报名后将进入真实活动群。"
          composePlaceholder="发消息到活动群…"
        />
      );
    }

    return (
      <div className="page">
        <header className="chat-room-header">
          <Link to="/messages" className="chat-room-header__back" aria-label="返回">
            ‹
          </Link>
          <h1>活动群</h1>
          <span className="chat-room-header__spacer" />
        </header>
        <p className="empty">活动群不存在，请先报名并支付组局</p>
      </div>
    );
  }

  const listing = getGroupListing(group.listingId);
  const statusLabel =
    group.status === 'recruiting'
      ? '招募中'
      : group.status === 'confirmed'
        ? '已成行'
        : '已结束';

  const messages: ChatMessage[] = [
    {
      id: 'live-group-card',
      kind: 'booking_card',
      align: 'system',
      card: {
        ...boardgameGroupCard,
        title: listing?.title ?? group.name,
        subtitle: `主理人 ${group.hostName}`,
        whenLabel: listing?.whenLabel ?? '',
        placeLabel: listing?.placeLabel,
        statusLabel: `${statusLabel} · 已加入`,
        priceYuan: listing?.priceYuan,
        primaryCta: {
          label: '查看订单',
          to: '/profile/orders',
        },
        secondaryCta: {
          label: '查看活动',
          to: listing ? `/group/${listing.id}` : '/',
        },
      },
    },
    ...getGroupChatMessages('ag-g-boardgame').filter((m) => m.kind === 'text'),
  ];

  return (
    <ChatRoomShell
      title={group.name}
      subtitle={`活动群 · ${statusLabel}`}
      meta={
        listing ? (
          <div className="chat-room-meta soft-card soft-card--static">
            <p className="muted">
              {listing.whenLabel} · {listing.placeLabel}
            </p>
            <p className="body-text">
              主理人 {group.hostName} · 本群用于活动协调，交割仍以 App 内订单确认为准。
            </p>
          </div>
        ) : undefined
      }
      messages={messages}
      hint="Demo 活动群占位。真实版本支持文字、图片、主理人公告与系统提醒。"
      composePlaceholder="发消息到活动群…"
    />
  );
}
