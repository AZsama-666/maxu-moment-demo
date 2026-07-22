import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  activityGroupIdForListing,
  getActivityGroupByOrderId,
  useActivityGroups,
} from '../state/activityGroupStore';
import {
  formatRefundPolicySummary,
  getGroupListing,
} from '../data/marketMock';
import {
  confirmGroupOrderSide,
  getGroupOrder,
  isGroupListingOrder,
  isGroupOrderPaid,
  useGroupOrders,
} from '../state/groupOrderStore';

export function GroupConfirmPage() {
  useGroupOrders();
  useActivityGroups();
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

  const listing = getGroupListing(order.listingId);
  const isGroupEvent = isGroupListingOrder(order);
  const paid = isGroupOrderPaid(order);
  const activityGroup =
    getActivityGroupByOrderId(order.id) ??
    (listing && paid ? { id: activityGroupIdForListing(listing.id) } : null);
  const done = order.status === 'completed';

  return (
    <div className="page">
      <PageHeader title={done ? '交割完成' : paid ? '待双方确认' : '待支付'} backTo="/" />

      {isGroupEvent && !paid && !done && (
        <div className="soft-card soft-card--static group-order-unpaid">
          <p>
            <strong>订单待支付</strong>
          </p>
          <p className="muted">
            支付成功后将自动加入活动群；主理人微信等联系方式亦在付款后可见。
          </p>
          {listing?.refundPolicy && (
            <p className="body-text group-order-unpaid__refund">
              {formatRefundPolicySummary(listing.refundPolicy)}
            </p>
          )}
          <Link
            to={`/group-pay/${order.id}`}
            className="btn btn--primary btn--block"
            style={{ marginTop: 12 }}
          >
            去支付
          </Link>
        </div>
      )}

      {isGroupEvent && paid && !done && (
        <div className="group-order-contact soft-card soft-card--static">
          <p>
            <strong>已自动加入活动群</strong>
          </p>
          <p className="muted">
            主理人可在群内发布集合点、注意事项；复杂问题也可私聊主理人。
          </p>
          <div className="group-order-contact__actions">
            {activityGroup && (
              <Link
                to={`/messages/chat/${activityGroup.id}`}
                className="btn btn--primary btn--block"
              >
                进入活动群
              </Link>
            )}
            <Link
              to={`/messages/dm/${order.hostProviderId}`}
              className="btn btn--ghost btn--block"
            >
              联系主理人
            </Link>
          </div>
        </div>
      )}

      <div
        className="soft-card soft-card--static"
        style={{ marginTop: isGroupEvent && !done ? 12 : 0 }}
      >
        <strong>{order.title}</strong>
        <p className="muted">
          {order.hostName} · {order.whenLabel} · {order.placeLabel}
        </p>
        <p>
          <strong>¥{order.priceYuan.toFixed(0)}</strong>
          {isGroupEvent && (
            <span className="muted"> · {paid ? '已支付' : '待支付'}</span>
          )}
        </p>
      </div>

      {isGroupEvent && paid && listing?.refundPolicy && (
        <div className="group-refund-card soft-card soft-card--static">
          <h3 className="group-detail-section__subtitle">退改规则</h3>
          <p className="body-text">
            {formatRefundPolicySummary(listing.refundPolicy)}
          </p>
        </div>
      )}

      {isGroupEvent && paid && listing?.hostWechatId && (
        <div className="group-order-wechat soft-card soft-card--static">
          <h3 className="group-detail-section__subtitle">加主理人微信</h3>
          <p className="body-text">
            微信号：<strong>{listing.hostWechatId}</strong>
          </p>
          {listing.joinNoteTemplate && (
            <p className="muted">添加时请备注：{listing.joinNoteTemplate}</p>
          )}
          <p className="group-order-wechat__tip muted">
            站外联系请注意安全；交易与退改以 App 内订单为准。
          </p>
        </div>
      )}

      {done ? (
        <div className="soft-card soft-card--static" style={{ marginTop: 12 }}>
          <p>
            <strong>双方已确认收货交割</strong>
          </p>
          <p className="muted">线下履约完成。本 Demo 不产生真实结算。</p>
          {isGroupEvent && paid && activityGroup && (
            <Link
              to={`/messages/chat/${activityGroup.id}`}
              className="btn btn--ghost btn--block"
              style={{ marginTop: 12 }}
            >
              查看活动群记录
            </Link>
          )}
          <Link to="/" className="btn btn--primary btn--block" style={{ marginTop: 12 }}>
            回到市集
          </Link>
        </div>
      ) : paid ? (
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
      ) : null}
    </div>
  );
}
