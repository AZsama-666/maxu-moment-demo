import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { updateOrderStatus, useOrder } from '../state/orderStore';

export function WaitingPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const navigate = useNavigate();

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="等待室" backTo="/profile/orders" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  const enterFulfill = () => {
    updateOrderStatus(order.id, 'in_progress');
    navigate(order.form === 'voice' ? `/fulfill/voice/${order.id}` : `/fulfill/video/${order.id}`);
  };

  const canEnter =
    order.status === 'booked' ||
    order.status === 'accepted' ||
    order.status === 'in_progress';

  return (
    <div className="page page--center">
      <PageHeader title="等待室" backTo="/profile/orders" />

      <div className="waiting-card">
        <div className="avatar avatar--xl" style={{ background: order.form === 'voice' ? '#3DB8A0' : '#4A7FD4' }}>
          {order.providerName.slice(0, 1)}
        </div>
        <h2>{order.title}</h2>
        <p className="muted">
          {order.providerName} · {order.form === 'voice' ? '语音互动' : '视频互动'} ·{' '}
          {order.durationSec} 秒
        </p>
        <p className="waiting-time">预约时间：{order.slotLabel}</p>

        <div className="checklist">
          <div>✓ 麦克风权限（模拟已就绪）</div>
          {order.form === 'video' && <div>✓ 摄像头权限（模拟已就绪）</div>}
          <div>✓ 网络状态良好（模拟）</div>
        </div>

        <p className="body-text">
          正式产品会展示到点倒计时与迟到规则。本 Demo 可直接模拟到点接通。
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
