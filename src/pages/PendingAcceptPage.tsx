import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { refundOrder, statusLabel, useOrder } from '../state/orderStore';

export function PendingAcceptPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const navigate = useNavigate();

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="预约状态" backTo="/profile/orders" />
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
          <h2>已退款</h2>
          <p className="muted">¥{order.priceYuan.toFixed(1)} 已原路退回</p>
          <Link to={`/moment/${order.momentId}`} className="btn btn--primary btn--block">
            重新预约
          </Link>
          <Link to="/profile/orders" className="text-link center-link">
            查看我的订单
          </Link>
        </div>
      </div>
    );
  }

  if (order.status === 'pending_confirm') {
    return (
      <div className="page page--center">
        <PageHeader title="等待确认" backTo="/profile/orders" />
        <div className="waiting-card">
          <h2>等待 {order.providerName} 确认预约</h2>
          <p className="muted">{order.slotLabel}</p>
          <div className="rules-bar" style={{ textAlign: 'left', marginTop: 8 }}>
            远档预约需供给方确认后才会锁定时间。确认前你可以申请退款。
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => refundOrder(order.id)}
          >
            申请退款
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => navigate('/profile/orders')}
          >
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  if (order.status === 'booked' || order.status === 'in_progress') {
    navigate(`/waiting/${order.id}`, { replace: true });
    return null;
  }

  return (
    <div className="page">
      <PageHeader title="预约状态" backTo="/profile/orders" />
      <p className="empty">当前状态：{statusLabel(order.status)}</p>
    </div>
  );
}
