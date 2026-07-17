import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import type { InteractionForm } from '../data/mock';
import {
  pendingAcceptRemainSec,
  statusLabel,
  timingLabel,
  useOrders,
} from '../state/orderStore';

type Filter = 'all' | InteractionForm;

export function OrdersPage() {
  const orders = useOrders();
  const [filter, setFilter] = useState<Filter>('all');
  const list =
    filter === 'all' ? orders : orders.filter((o) => o.form === filter);

  return (
    <div className="page">
      <PageHeader title="我的订单" backTo="/profile" />

      <div className="chat-filter" role="tablist" style={{ marginTop: 0 }}>
        {(
          [
            ['all', '全部'],
            ['voice', '语音'],
            ['video', '视频'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`chat-filter__tab ${filter === key ? 'chat-filter__tab--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="empty">还没有订单。去 Moment 找人约一个专属时刻吧。</p>
      ) : (
        <div className="stack">
          {list.map((order) => {
            const remainSec = pendingAcceptRemainSec(order);
            return (
              <div key={order.id} className="order-card">
                <div className="moment-card__row">
                  <strong>
                    {order.title}
                    {(order.quantity ?? 1) > 1 ? ` ×${order.quantity}` : ''}
                  </strong>
                  <span className="pill">{statusLabel(order.status)}</span>
                </div>
                <p className="muted">
                  <span className="trust-chip">
                    {order.form === 'voice' ? '语音' : '视频'}
                  </span>{' '}
                  {order.providerName} · {timingLabel(order.timing)} · {order.slotLabel}
                  {(order.quantity ?? 1) > 1 ? ` · ${order.durationSec} 秒` : ''}
                </p>
                {remainSec !== null && remainSec > 0 && (
                  <p className="muted">剩余约 {Math.ceil(remainSec / 60)} 分钟未接将自动退款</p>
                )}
                <p>¥{order.priceYuan.toFixed(1)}</p>
                <div className="order-actions">
                  {order.status === 'pending_payment' && (
                    <Link to={`/pay/${order.id}`} className="btn btn--primary btn--sm">
                      去支付
                    </Link>
                  )}
                  {order.status === 'pending_accept' && (
                    <Link
                      to={`/pending-accept/${order.id}`}
                      className="btn btn--primary btn--sm"
                    >
                      查看接单进度
                    </Link>
                  )}
                  {(order.status === 'accepted' || order.status === 'booked') && (
                    <Link to={`/waiting/${order.id}`} className="btn btn--primary btn--sm">
                      进入等待室
                    </Link>
                  )}
                  {order.status === 'in_progress' && (
                    <Link
                      to={
                        order.form === 'voice'
                          ? `/fulfill/voice/${order.id}`
                          : `/fulfill/video/${order.id}`
                      }
                      className="btn btn--primary btn--sm"
                    >
                      继续履约
                    </Link>
                  )}
                  {order.status === 'completed' && (
                    <Link to={`/done/${order.id}`} className="btn btn--ghost btn--sm">
                      查看完成页
                    </Link>
                  )}
                  {order.status === 'refunded' && (
                    <Link
                      to={`/checkout/${order.momentId}`}
                      className="btn btn--primary btn--sm"
                    >
                      重新下单
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
