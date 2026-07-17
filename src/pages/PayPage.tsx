import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { payOrder, statusLabel, timingLabel, useOrder } from '../state/orderStore';

export function PayPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="支付" backTo="/" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Mock 支付"
        backTo={`/moment/${order.momentId}`}
      />

      <div className="soft-card soft-card--static">
        <p className="muted">订单号 {order.id}</p>
        <strong>
          {order.title}
          {(order.quantity ?? 1) > 1 ? ` ×${order.quantity} 份` : ''}
        </strong>
        <p>
          {order.providerName} · {timingLabel(order.timing)} · {order.slotLabel}
        </p>
        <p>
          方式：{order.payMethod === 'cash' ? '现金' : '平台币'} · 时长{' '}
          {order.durationSec} 秒 · 状态 {statusLabel(order.status)}
        </p>
        <p className="price-line">¥{order.priceYuan.toFixed(1)}</p>
      </div>

      <p className="body-text">点击下方按钮模拟支付成功，不产生真实扣款。</p>
      {error && <p className="error">{error}</p>}

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={order.status !== 'pending_payment'}
        onClick={() => {
          const ok = payOrder(order.id);
          if (!ok) {
            setError('支付失败：名额可能已售罄');
            return;
          }
          if (order.timing === 'asap') {
            navigate(`/pending-accept/${order.id}`);
          } else {
            navigate(`/waiting/${order.id}`);
          }
        }}
      >
        支付成功
      </button>

      <button
        type="button"
        className="btn btn--ghost btn--block"
        onClick={() => navigate('/profile/orders')}
      >
        稍后再付 · 查看订单
      </button>
    </div>
  );
}
