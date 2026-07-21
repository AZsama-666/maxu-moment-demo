import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import {
  canStartEarly,
  markProviderReady,
  refundOrder,
  shouldAutoRefundNearTerm,
  shouldOfferNearTermRefund,
  slotCountdownSec,
  startEarly,
  useOrder,
} from '../../state/orderStore';
import { getOrderPerspective, providerFulfillPath } from '../../utils/orderPerspective';

export function SupplyWaitingPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!order) return;
    if (getOrderPerspective(order) !== 'provider') {
      navigate(`/waiting/${order.id}`, { replace: true });
      return;
    }
    if (shouldAutoRefundNearTerm(order, now)) {
      refundOrder(order.id);
    }
  }, [order, now, navigate]);

  useEffect(() => {
    if (!order || order.status !== 'in_progress') return;
    navigate(providerFulfillPath(order), { replace: true });
  }, [order, navigate]);

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="供给等待室" backTo="/profile/my-moments/tasks" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  if (order.status === 'pending_confirm') {
    return (
      <div className="page page--center">
        <PageHeader title="等待确认" backTo="/profile/my-moments/tasks" />
        <div className="waiting-card">
          <h2>等待你确认预约</h2>
          <p className="muted">{order.slotLabel}</p>
          <p className="body-text">买家已付款，请在待处理任务中确认预约。</p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => navigate('/profile/my-moments/tasks')}
          >
            去任务页确认
          </button>
        </div>
      </div>
    );
  }

  const countdown = slotCountdownSec(order, now);
  const offerRefund = shouldOfferNearTermRefund(order, now);
  const bothReady = order.providerReady && order.buyerReady;
  const canStart = canStartEarly(order, now);

  const handleStart = () => {
    if (!canStartEarly(order, now) && now < order.slotStartAt) return;
    if (order.status === 'booked') startEarly(order.id);
    navigate(providerFulfillPath(order));
  };

  return (
    <div className="page page--center">
      <PageHeader title="供给等待室" backTo="/profile/my-moments/tasks" />

      <div className="waiting-card">
        <div className="avatar avatar--xl" style={{ background: '#E0A050' }}>
          {order.buyerName.slice(0, 1)}
        </div>
        <h2>{order.title}</h2>
        <p className="muted">
          买家 {order.buyerName} ·{' '}
          {order.form === 'voice' ? '语音互动' : '视频互动'} · {order.durationSec} 秒
        </p>
        <p className="waiting-time">预约时间：{order.slotLabel}</p>

        {countdown !== null && order.status === 'booked' && now < order.slotStartAt && (
          <p className="waiting-countdown">
            距到点还有 {Math.floor(countdown / 60)} 分 {countdown % 60} 秒
          </p>
        )}

        <div className="checklist">
          <div>{order.providerReady ? '✓' : '○'} 你已标记就绪</div>
          <div>{order.buyerReady ? '✓' : '○'} 买家已就位</div>
        </div>
        <p className="body-text muted">Demo：点就绪会模拟对方也已就位</p>

        {!order.providerReady && order.status === 'booked' && (
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => markProviderReady(order.id)}
          >
            标记就绪
          </button>
        )}

        {order.providerReady && !order.buyerReady && now < order.slotStartAt && (
          <p className="body-text muted">等待买家就位…</p>
        )}

        {offerRefund && (
          <div className="rules-bar rules-bar--warn">
            <p>到点前 3 分钟你尚未标记就绪，买家可能申请退款。</p>
          </div>
        )}

        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={!canStart && now < order.slotStartAt}
          onClick={handleStart}
        >
          {bothReady && now < order.slotStartAt
            ? '双方已就位 · 开始履约'
            : now >= order.slotStartAt
              ? '到点 · 开始履约'
              : '等待双方就位'}
        </button>

        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => navigate('/messages')}
        >
          返回消息
        </button>
      </div>
    </div>
  );
}
