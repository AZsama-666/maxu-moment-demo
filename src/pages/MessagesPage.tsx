import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  chatShortcuts,
  demoMessageConversations,
  type Conversation,
} from '../data/appShellMock';
import {
  listActivityGroupConversations,
  useActivityGroups,
} from '../state/activityGroupStore';
import { useMessageReminders } from '../state/messageReminders';
import { useSupplyTasks } from '../state/supplyTasks';

const filters = ['全部', '私聊', '群聊'] as const;
type Filter = (typeof filters)[number];

type ChatListItem = Conversation;

export function MessagesPage() {
  const [filter, setFilter] = useState<Filter>('全部');
  const supplyTasks = useSupplyTasks();
  const reminders = useMessageReminders();
  useActivityGroups();

  const activityGroups = listActivityGroupConversations();
  const dynamicListingIds = new Set(
    activityGroups.map((g) => g.id.replace(/^ag-/, '')),
  );

  const list = useMemo(() => {
    const staticDemos = demoMessageConversations.filter((c) => {
      if (c.subtype === 'activity' && c.id.startsWith('ag-')) {
        const listingId = c.id.replace(/^ag-/, '');
        return !dynamicListingIds.has(listingId);
      }
      return true;
    });

    const merged: ChatListItem[] = [...activityGroups, ...staticDemos];

    if (filter === '私聊') {
      return merged.filter((c) => c.kind === 'private');
    }
    if (filter === '群聊') {
      return merged.filter((c) => c.kind === 'group');
    }
    return merged;
  }, [activityGroups, dynamicListingIds, filter]);

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
        {chatShortcuts.map((s) => {
          const content = (
            <>
              <span className="chat-shortcut__icon" style={{ background: s.color }}>
                {s.icon}
              </span>
              <span className="chat-shortcut__label">{s.label}</span>
            </>
          );
          if (s.id === 's1') {
            return (
              <Link key={s.id} to="/profile/my-moments/tasks" className="chat-shortcut">
                {content}
              </Link>
            );
          }
          return (
            <div key={s.id} className="chat-shortcut">
              {content}
            </div>
          );
        })}
      </div>

      {supplyTasks.total > 0 && (
        <Link
          to="/profile/my-moments/tasks"
          className="feed-banner-signal"
          style={{ margin: reminders.length > 0 ? '8px 0 0' : '8px 0 0' }}
        >
          <span className="moment-signal-pill">供给任务</span>
          <span>
            {supplyTasks.upcoming.length > 0
              ? `你有 ${supplyTasks.upcoming.length} 笔待履约，进入待处理任务`
              : `你有 ${supplyTasks.total} 项供给任务待处理`}
          </span>
        </Link>
      )}

      {reminders.length > 0 && (
        <section className="section" style={{ marginTop: 8 }}>
          <h3 className="section__title">履约提醒</h3>
          <div className="stack">
            {reminders.slice(0, 3).map((item) => (
              <Link key={item.id} to={item.to} className="feed-banner-signal">
                <span
                  className={`moment-signal-pill ${
                    item.perspective === 'provider' ? '' : 'moment-signal-pill--buyer'
                  }`}
                >
                  {item.perspective === 'provider' ? '供给' : '需求'}
                </span>
                <span>{item.preview}</span>
              </Link>
            ))}
          </div>
        </section>
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
        {list.map((c) => {
          const itemClass = [
            'chat-item',
            c.kind === 'group' ? 'chat-item--group' : '',
            c.subtype === 'activity' ? 'chat-item--activity' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const body = (
            <>
              <span className="chat-item__avatar" style={{ background: c.avatarColor }}>
                {c.subtype === 'activity' ? '局' : c.name.slice(0, 1)}
              </span>
              <div className="chat-item__body">
                <div className="chat-item__top">
                  <span className="chat-item__name">
                    {c.name}
                    {c.subtype === 'activity' && (
                      <span className="chat-item__tag">活动群</span>
                    )}
                  </span>
                  <span className="chat-item__time">{c.time}</span>
                </div>
                <div className="chat-item__bottom">
                  <span className="chat-item__preview">{c.preview}</span>
                  {c.unread > 0 && <span className="chat-item__badge">{c.unread}</span>}
                </div>
              </div>
            </>
          );

          if (c.to) {
            return (
              <Link key={c.id} to={c.to} className={itemClass}>
                {body}
              </Link>
            );
          }

          return (
            <div key={c.id} className={itemClass}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
