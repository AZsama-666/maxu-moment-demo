import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { statusLabel, useOrder } from '../state/orderStore';

export function DonePage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="完成" backTo="/" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  return (
    <div className="page page--center">
      <PageHeader title="履约完成" backTo="/" />
      <div className="done-card">
        <div className="done-check">✓</div>
        <h2>专属时刻已结束</h2>
        <p className="muted">
          {order.title} · {order.providerName}
        </p>
        <p>状态：{statusLabel(order.status)}</p>
        <p className="body-text">
          售后入口已预留：如需退款或争议，可提交人工处理（本 Demo 仅占位）。
        </p>
        <button type="button" className="btn btn--ghost btn--block" disabled>
          申请售后（占位）
        </button>
        <Link to="/profile/orders" className="btn btn--primary btn--block">
          查看我的订单
        </Link>
        <Link to="/" className="text-link center-link">
          回到 Moment
        </Link>
      </div>
    </div>
  );
}
