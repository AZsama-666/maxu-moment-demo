import { useState } from 'react';
import { Link } from 'react-router-dom';
import { chatShortcuts, conversations } from '../data/appShellMock';
import { usePendingAcceptOrders } from '../state/orderStore';

const filters = ['全部', '私聊', '群聊'] as const;
type Filter = (typeof filters)[number];

export function MessagesPage() {
  const [filter, setFilter] = useState<Filter>('全部');
  const pendingAccept = usePendingAcceptOrders();

  const list = conversations.filter((c) => {
    if (filter === '私聊') return c.kind === 'private';
    if (filter === '群聊') return c.kind === 'group';
    return true;
  });

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>消息</h1>
        <div className="chat-header__actions">
          <span aria-label="搜索">⌕</span>
          <span aria-label="更多">＋</span>
        </div>
      </header>

      <div className="chat-shortcuts">
        {chatShortcuts.map((s) => (
          <div key={s.id} className="chat-shortcut">
            <span className="chat-shortcut__icon" style={{ background: s.color }}>
              {s.icon}
            </span>
            <span className="chat-shortcut__label">{s.label}</span>
          </div>
        ))}
      </div>

      {pendingAccept.length > 0 && (
        <Link to="/profile/my-moments" className="feed-banner-signal" style={{ margin: '8px 0 0' }}>
          <span className="moment-signal-pill">待接单</span>
          <span>你有 {pendingAccept.length} 笔尽快单待接单，点击处理</span>
        </Link>
      )}

      <div className="chat-filter" role="tablist">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`chat-filter__tab ${filter === f ? 'chat-filter__tab--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="chat-list">
        {list.map((c) => (
          <div key={c.id} className={`chat-item ${c.kind === 'group' ? 'chat-item--group' : ''}`}>
            <span className="chat-item__avatar" style={{ background: c.avatarColor }}>
              {c.name.slice(0, 1)}
            </span>
            <div className="chat-item__body">
              <div className="chat-item__top">
                <span className="chat-item__name">{c.name}</span>
                <span className="chat-item__time">{c.time}</span>
              </div>
              <div className="chat-item__bottom">
                <span className="chat-item__preview">{c.preview}</span>
                {c.unread > 0 && <span className="chat-item__badge">{c.unread}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
