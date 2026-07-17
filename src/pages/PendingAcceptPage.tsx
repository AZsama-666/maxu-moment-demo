import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getMoment } from '../data/catalog';
import {
  acceptOrder,
  ASAP_SLA_MIN,
  pendingAcceptRemainSec,
  refundOrder,
  statusLabel,
  useOrder,
} from '../state/orderStore';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PendingAcceptPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const navigate = useNavigate();
  const moment = order ? getMoment(order.momentId) : undefined;
  const [remain, setRemain] = useState<number | null>(
    order ? pendingAcceptRemainSec(order) : null,
  );
  const refunded = useRef(false);

  useEffect(() => {
    if (!order || order.status !== 'pending_accept') return;
    const timer = window.setInterval(() => {
      const left = pendingAcceptRemainSec(order);
      setRemain(left);
      if (left !== null && left <= 0 && !refunded.current) {
        refunded.current = true;
        window.clearInterval(timer);
        refundOrder(order.id);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [order]);

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="等待接单" backTo="/profile/orders" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  if (order.status === 'refunded') {
    return (
      <div className="page page--center">
        <PageHeader title="已退款" backTo="/" />
        <div className="done-card">
          <div className="done-check">¥</div>
          <h2>已自动退款</h2>
          <p className="muted">
            超时未接单，¥{order.priceYuan.toFixed(1)} 已原路退回
          </p>
          <p className="body-text">
            你可以重新下单，或改为预约 TA 的档期。
          </p>
          <Link
            to={`/checkout/${order.momentId}`}
            className="btn btn--primary btn--block"
          >
            重新下单
          </Link>
          <Link
            to={`/checkout/${order.momentId}?timing=scheduled`}
            className="btn btn--ghost btn--block"
          >
            改为预约档期
          </Link>
          <Link to="/profile/orders" className="text-link center-link">
            查看我的订单
          </Link>
        </div>
      </div>
    );
  }

  if (order.status === 'accepted' || order.status === 'booked') {
    return (
      <div className="page page--center">
        <PageHeader title="已接单" backTo="/profile/orders" />
        <div className="waiting-card">
          <h2>对方已接单</h2>
          <p className="muted">可以进入等待室准备履约</p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => navigate(`/waiting/${order.id}`)}
          >
            进入等待室
          </button>
        </div>
      </div>
    );
  }

  if (order.status !== 'pending_accept') {
    return (
      <div className="page">
        <PageHeader title="等待接单" backTo="/profile/orders" />
        <p className="empty">当前状态：{statusLabel(order.status)}</p>
      </div>
    );
  }

  const shown = remain ?? pendingAcceptRemainSec(order) ?? 0;

  return (
    <div className="page page--center">
      <PageHeader title="等待接单" backTo="/profile/orders" />
      <div className="waiting-card">
        <div
          className="avatar avatar--xl"
          style={{ background: order.form === 'voice' ? '#3DB8A0' : '#4A7FD4' }}
        >
          {order.providerName.slice(0, 1)}
        </div>
        <h2>等待 {order.providerName} 接单</h2>
        <p className="muted">{order.title}</p>

        <div className="countdown">{fmt(shown)}</div>
        <div className="rules-bar" style={{ textAlign: 'left', marginTop: 8 }}>
          尽快单付款后 {ASAP_SLA_MIN} 分钟内未接单，自动全额退款
        </div>

        <div className="checklist">
          <div>✓ 付款成功，已通知对方接单</div>
          <div>
            {moment && moment.avgResponseMin > 0
              ? `○ TA 的平均响应时长 ${moment.avgResponseMin} 分钟`
              : '○ 新发布，暂无平均响应数据'}
          </div>
          <div>○ 接单后进入等待室开始履约</div>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            acceptOrder(order.id);
            navigate(`/waiting/${order.id}`);
          }}
        >
          模拟对方接单
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => {
            refunded.current = true;
            refundOrder(order.id);
          }}
        >
          模拟超时（立即退款）
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => navigate('/profile/orders')}
        >
          稍后再看 · 保持等待
        </button>
      </div>
    </div>
  );
}
