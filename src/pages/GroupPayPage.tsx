import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  formatRefundPolicySummary,
  getGroupListing,
} from '../data/marketMock';
import {
  getGroupOrder,
  payGroupOrder,
  useGroupOrders,
  type GroupPayMethod,
} from '../state/groupOrderStore';

export function GroupPayPage() {
  useGroupOrders();
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const order = getGroupOrder(orderId);
  const [payMethod, setPayMethod] = useState<GroupPayMethod>('cash');
  const [error, setError] = useState('');

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="组局支付" backTo="/" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  const listing = getGroupListing(order.listingId);
  const paid = order.paymentStatus === 'paid';

  if (paid) {
    return (
      <div className="page">
        <PageHeader title="组局支付" backTo="/" />
        <div className="soft-card soft-card--static">
          <p>
            <strong>已支付</strong>
          </p>
          <p className="muted">订单已完成付款，可进入活动群与订单确认。</p>
        </div>
        <Link
          to={`/group-order/${order.id}`}
          className="btn btn--primary btn--block"
          style={{ marginTop: 12 }}
        >
          查看订单
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Mock 支付"
        backTo={listing ? `/group/${listing.id}` : '/'}
      />

      <div className="soft-card soft-card--static">
        <p className="muted">订单号 {order.id}</p>
        <strong>{order.title}</strong>
        <p className="muted">
          {order.hostName} · {order.whenLabel} · {order.placeLabel}
        </p>
        <p className="price-line">¥{order.priceYuan.toFixed(0)}</p>
      </div>

      {listing?.refundPolicy && (
        <div className="group-refund-card soft-card soft-card--static">
          <h3 className="group-detail-section__subtitle">退改规则</h3>
          <p className="body-text">
            {formatRefundPolicySummary(listing.refundPolicy)}
          </p>
          <p className="muted group-refund-card__hint">
            付款即视为已知悉退改规则；退款申请以 App 内订单为准。
          </p>
        </div>
      )}

      <section className="section section--pay">
        <h3 className="section__title">支付方式</h3>
        <div className="pay-methods">
          <button
            type="button"
            className={`slot-item ${payMethod === 'cash' ? 'slot-item--active' : ''}`}
            onClick={() => setPayMethod('cash')}
          >
            现金支付
          </button>
          <button
            type="button"
            className={`slot-item ${payMethod === 'coin' ? 'slot-item--active' : ''}`}
            onClick={() => setPayMethod('coin')}
          >
            平台币支付
          </button>
        </div>
      </section>

      <p className="body-text">
        点击下方按钮模拟支付成功。支付后将自动加入活动群，并可查看主理人联系方式（若已配置）。
      </p>
      {error && <p className="error">{error}</p>}

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => {
          const result = payGroupOrder(order.id, payMethod);
          if (!result) {
            setError('支付失败：名额可能已满');
            return;
          }
          navigate(`/group-order/${order.id}`);
        }}
      >
        支付成功
      </button>

      <Link
        to={`/group-order/${order.id}`}
        className="btn btn--ghost btn--block"
      >
        稍后再付 · 查看订单
      </Link>
    </div>
  );
}
