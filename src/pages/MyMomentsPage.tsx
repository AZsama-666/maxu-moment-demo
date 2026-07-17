import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { isAcceptingNow, type InteractionForm } from '../data/mock';
import {
  acceptOrder,
  statusLabel,
  timingLabel,
  useOrders,
  type Order,
} from '../state/orderStore';
import { getSkuFulfillmentStats } from '../state/skuStats';
import {
  getOpenListingByForm,
  updateSupplyMoment,
  useSupplyListings,
  useSupplyTick,
} from '../state/supplyStore';

export function MyMomentsPage() {
  useSupplyTick();
  useSupplyListings();
  const orders = useOrders();
  const navigate = useNavigate();

  return (
    <div className="page">
      <PageHeader title="我的 Moment" backTo="/profile" />
      <p className="section__desc">
        语音与视频是两条独立 SKU。各自维护尽快接单、暂停与档期，履约队列互不影响。
      </p>

      <SkuPanel form="voice" title="1V1 语音" orders={orders} navigate={navigate} />
      <SkuPanel form="video" title="1V1 视频" orders={orders} navigate={navigate} />
    </div>
  );
}

function SkuPanel({
  form,
  title,
  orders,
  navigate,
}: {
  form: InteractionForm;
  title: string;
  orders: Order[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const listing = getOpenListingByForm(form);
  const stats = getSkuFulfillmentStats(form, orders, listing);
  const formOrders = orders.filter((o) => o.form === form);
  const pending = formOrders.filter((o) => o.status === 'pending_accept');
  const active = formOrders.filter(
    (o) =>
      o.status === 'accepted' ||
      o.status === 'booked' ||
      o.status === 'in_progress',
  );

  return (
    <section className="section sku-panel">
      <div className="section__head">
        <h2 className="section__title">{title}</h2>
        {listing && <span className="pill">{listing.statusLabel}</span>}
      </div>

      {!listing ? (
        <div className="soft-card soft-card--static">
          <p className="muted">尚未开放该形态的长期供给</p>
          <Link
            to={`/profile/my-moments/create?form=${form}`}
            className="btn btn--primary btn--block"
          >
            开放{form === 'voice' ? '语音' : '视频'} Moment
          </Link>
        </div>
      ) : (
        <div className="order-card">
          <strong>{listing.title}</strong>
          <p className="muted">
            {listing.durationSec} 秒 · ¥{listing.priceYuan.toFixed(1)}
          </p>

          <div className="sku-stats">
            <div className="sku-stat">
              <strong>{stats.pendingAccept}</strong>
              <span>待接单</span>
            </div>
            <div className="sku-stat">
              <strong>{stats.waitingFulfill}</strong>
              <span>待履约</span>
            </div>
            <div className="sku-stat">
              <strong>{stats.inProgress}</strong>
              <span>履约中</span>
            </div>
            <div className="sku-stat">
              <strong>{stats.completedToday}</strong>
              <span>今日完成</span>
            </div>
          </div>

          <div className="moment-card__trust">
            <span className="trust-chip">
              {listing.asapEnabled ? '尽快开' : '尽快关'}
            </span>
            <span className="trust-chip">
              {isAcceptingNow(listing) ? '接单中' : '已暂停'}
            </span>
            <span className="trust-chip muted-chip">档 {stats.slotRemaining}</span>
            <span className="trust-chip muted-chip">已履约 {listing.fulfilledCount}</span>
            <span className="trust-chip muted-chip">
              均响 {listing.avgResponseMin || '—'} 分
            </span>
          </div>

          {listing.slots.length > 0 && (
            <p className="muted">{listing.slots.map((s) => s.label).join('、')}</p>
          )}

          <div className="order-actions" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() =>
                updateSupplyMoment(listing.id, {
                  asapEnabled: !listing.asapEnabled,
                })
              }
            >
              {listing.asapEnabled ? '关闭尽快' : '开启尽快'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!listing.asapEnabled}
              onClick={() =>
                updateSupplyMoment(listing.id, {
                  acceptingPaused: !listing.acceptingPaused,
                })
              }
            >
              {listing.acceptingPaused ? '恢复接单' : '暂停接单'}
            </button>
            <Link
              to={`/profile/my-moments/create?form=${form}`}
              className="btn btn--ghost btn--sm"
            >
              编辑档期/价格
            </Link>
            <Link to={`/moment/${listing.id}`} className="btn btn--ghost btn--sm">
              购买页
            </Link>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => updateSupplyMoment(listing.id, { status: 'offline' })}
            >
              下架
            </button>
          </div>

          {pending.length > 0 && (
            <div className="sku-queue">
              <h3 className="section__title">待接单 · {pending.length}</h3>
              {pending.map((order) => (
                <div key={order.id} className="sku-queue__item">
                  <div>
                    <strong>{order.title}</strong>
                    <p className="muted">
                      {timingLabel(order.timing)} · {statusLabel(order.status)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => {
                      acceptOrder(order.id);
                      navigate(`/waiting/${order.id}`);
                    }}
                  >
                    接单
                  </button>
                </div>
              ))}
            </div>
          )}

          {active.length > 0 && (
            <div className="sku-queue">
              <h3 className="section__title">进行中 · {active.length}</h3>
              {active.map((order) => (
                <div key={order.id} className="sku-queue__item">
                  <div>
                    <strong>{order.slotLabel}</strong>
                    <p className="muted">{statusLabel(order.status)}</p>
                  </div>
                  <Link
                    to={
                      order.status === 'in_progress'
                        ? order.form === 'voice'
                          ? `/fulfill/voice/${order.id}`
                          : `/fulfill/video/${order.id}`
                        : `/waiting/${order.id}`
                    }
                    className="btn btn--ghost btn--sm"
                  >
                    进入
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
