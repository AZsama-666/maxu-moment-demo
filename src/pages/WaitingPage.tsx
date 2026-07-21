import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  refundOrder,
  shouldAutoRefundNearTerm,
  shouldOfferNearTermRefund,
  slotCountdownSec,
  updateOrderStatus,
  useOrder,
} from '../state/orderStore';

export function WaitingPage() {
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
    if (shouldAutoRefundNearTerm(order, now)) {
      refundOrder(order.id);
    }
  }, [order, now]);

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="等待室" backTo="/profile/orders" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  if (order.status === 'pending_confirm') {
    return (
      <div className="page page--center">
        <PageHeader title="等待确认" backTo="/profile/orders" />
        <div className="waiting-card">
          <h2>等待供给方确认预约</h2>
          <p className="muted">{order.slotLabel}</p>
          <p className="body-text">
            远档预约需供给方在任务页确认后才会锁定。你也可以在订单页申请退款。
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => navigate('/profile/orders')}
          >
            返回订单
          </button>
        </div>
      </div>
    );
  }

  const enterFulfill = () => {
    updateOrderStatus(order.id, 'in_progress');
    navigate(
      order.form === 'voice'
        ? `/fulfill/voice/${order.id}`
        : `/fulfill/video/${order.id}`,
    );
  };

  const canEnter =
    order.status === 'booked' ||
    order.status === 'accepted' ||
    order.status === 'in_progress';

  const countdown = slotCountdownSec(order, now);
  const offerRefund = shouldOfferNearTermRefund(order, now);

  return (
    <div className="page page--center">
      <PageHeader title="等待室" backTo="/profile/orders" />

      <div className="waiting-card">
        <div
          className="avatar avatar--xl"
          style={{ background: order.form === 'voice' ? '#3DB8A0' : '#4A7FD4' }}
        >
          {order.providerName.slice(0, 1)}
        </div>
        <h2>{order.title}</h2>
        <p className="muted">
          {order.providerName} · {order.form === 'voice' ? '语音互动' : '视频互动'} ·{' '}
          {order.durationSec} 秒
        </p>
        <p className="waiting-time">预约时间：{order.slotLabel}</p>

        {countdown !== null && order.status === 'booked' && (
          <p className="waiting-countdown">
            距到点还有 {Math.floor(countdown / 60)} 分 {countdown % 60} 秒
          </p>
        )}

        {offerRefund && (
          <div className="rules-bar rules-bar--warn">
            <p>到点前 3 分钟，供给方尚未标记就绪。是否申请退款？</p>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => refundOrder(order.id)}
            >
              申请退款
            </button>
          </div>
        )}

        <div className="checklist">
          <div>✓ 麦克风权限（模拟已就绪）</div>
          {order.form === 'video' && <div>✓ 摄像头权限（模拟已就绪）</div>}
          <div>✓ 网络状态良好（模拟）</div>
        </div>

        <p className="body-text">
          到点后可模拟进入履约。近档订单若到点仍未开始，系统将自动退款。
        </p>

        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={!canEnter}
          onClick={enterFulfill}
        >
          模拟到点 · 进入履约
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => navigate('/profile/orders')}
        >
          稍后再来
        </button>
      </div>
    </div>
  );
}
