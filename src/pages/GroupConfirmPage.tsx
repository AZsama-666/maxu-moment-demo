import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  confirmGroupOrderSide,
  getGroupOrder,
  useGroupOrders,
} from '../state/groupOrderStore';

export function GroupConfirmPage() {
  useGroupOrders();
  const { orderId = '' } = useParams();
  const order = getGroupOrder(orderId);

  if (!order) {
    return (
      <div className="page">
        <PageHeader title="组局订单" backTo="/" />
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  const done = order.status === 'completed';

  return (
    <div className="page">
      <PageHeader title={done ? '交割完成' : '待双方确认'} backTo="/" />

      <div className="soft-card soft-card--static">
        <strong>{order.title}</strong>
        <p className="muted">
          {order.hostName} · {order.whenLabel} · {order.placeLabel}
        </p>
        <p>
          <strong>¥{order.priceYuan.toFixed(0)}</strong>
        </p>
      </div>

      {done ? (
        <div className="soft-card soft-card--static" style={{ marginTop: 12 }}>
          <p>
            <strong>双方已确认收货交割</strong>
          </p>
          <p className="muted">线下履约完成。本 Demo 不产生真实结算。</p>
          <Link to="/" className="btn btn--primary btn--block" style={{ marginTop: 12 }}>
            回到市集
          </Link>
        </div>
      ) : (
        <>
          <section className="section">
            <h3 className="section__title">确认进度</h3>
            <div className="confirm-steps">
              <div className={`confirm-step ${order.buyerConfirmed ? 'confirm-step--done' : ''}`}>
                买家确认收货 {order.buyerConfirmed ? '✓' : '· 待确认'}
              </div>
              <div className={`confirm-step ${order.hostConfirmed ? 'confirm-step--done' : ''}`}>
                供给方确认交割 {order.hostConfirmed ? '✓' : '· 待确认'}
              </div>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              双方都确认后订单完成（线下履约，非平台 1V1 通话）。
            </p>
          </section>

          <div className="stack" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn--primary btn--block"
              disabled={order.buyerConfirmed}
              onClick={() => confirmGroupOrderSide(order.id, 'buyer')}
            >
              {order.buyerConfirmed ? '买家已确认' : '模拟买家确认收货'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--block"
              disabled={order.hostConfirmed}
              onClick={() => confirmGroupOrderSide(order.id, 'host')}
            >
              {order.hostConfirmed ? '供给方已确认' : '模拟供给方确认交割'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
