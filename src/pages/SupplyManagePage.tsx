import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { loadListingIntoDraft } from '../state/launchDraftStore';
import { useSupplyTasks } from '../state/supplyTasks';
import {
  getSupplyListing,
  setSupplyStatus,
  updateSupplyMoment,
  useSupplyListings,
} from '../state/supplyStore';
import {
  formatBusinessHoursLabel,
  migrateScheduleFields,
} from '../utils/bookingSlots';
import { providerWaitingPath } from '../utils/orderPerspective';

export function SupplyManagePage() {
  useSupplyListings();
  const tasks = useSupplyTasks();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const listing = getSupplyListing(id);

  if (!listing) {
    return (
      <div className="page">
        <PageHeader title="管理 Moment" backTo="/profile/my-moments" />
        <p className="empty">未找到该 SKU</p>
      </div>
    );
  }

  const buyerPath =
    listing.kind === 'group'
      ? `/group/${listing.id}`
      : listing.kind === 'companion'
        ? `/companion/${listing.id}`
        : `/moment/${listing.id}`;
  const upcoming =
    listing.kind === '1v1'
      ? tasks.upcoming.filter((order) => order.momentId === listing.id)
      : [];
  const schedule =
    listing.kind === '1v1' ? migrateScheduleFields(listing) : null;

  return (
    <div className="page">
      <PageHeader title="管理 Moment" backTo="/profile/my-moments" />

      <div className="soft-card soft-card--static">
        <div className="section__head">
          <span className="pill">
            {listing.kind === 'group'
              ? '组局 · 狼人杀'
              : listing.kind === 'companion'
                ? '陪玩'
                : listing.form === 'voice'
                  ? '1V1 语音'
                  : '1V1 视频'}
          </span>
          <span className="muted">
            {listing.status === 'open' ? '正在销售' : '已下架'}
          </span>
        </div>
        <h2 className="detail-title">{listing.title}</h2>
        <p className="muted">
          {listing.kind === 'group'
            ? `${listing.whenLabel} · ${listing.placeLabel} · 剩 ${listing.seatsLeft}/${listing.seats} 席`
            : listing.kind === 'companion'
              ? `${listing.unitLabel} · ${listing.serviceTime}`
              : `${listing.durationSec} 秒/份 · ${listing.statusLabel}`}
          {' · '}¥{listing.priceYuan.toFixed(1)}
        </p>
      </div>

      {listing.kind === 'group' && listing.status === 'open' && (
        <section className="section">
          <h3 className="section__title">招募状态</h3>
          <div className="manage-row">
            <span>
              <strong>招募中</strong>
              <small>
                剩余 {listing.seatsLeft} 席 · 已认证主理人
              </small>
            </span>
          </div>
        </section>
      )}

      {listing.kind === '1v1' && listing.status === 'open' && schedule && (
        <section className="section">
          <h3 className="section__title">可约状态</h3>
          <div className="manage-row">
            <span>
              <strong>{listing.bookingOpen ? '开放可约' : '已暂停可约'}</strong>
              <small>
                {listing.bookingOpen
                  ? `营业时间 ${formatBusinessHoursLabel(schedule)}`
                  : '买家暂时看不到可约时间'}
              </small>
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() =>
                updateSupplyMoment(listing.id, {
                  bookingOpen: !listing.bookingOpen,
                })
              }
            >
              {listing.bookingOpen ? '暂停可约' : '恢复可约'}
            </button>
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="section">
          <h3 className="section__title">待履约 · {upcoming.length}</h3>
          <div className="stack">
            {upcoming.map((order) => (
              <Link
                key={order.id}
                to={providerWaitingPath(order.id)}
                className="manage-item"
              >
                <span>
                  <strong>{order.buyerName}</strong>
                  <small>
                    {order.slotLabel}
                    {!order.providerReady ? ' · 待标记就绪' : ''}
                    {order.buyerReady ? ' · 买家已就位' : ''}
                  </small>
                </span>
                <span>去就绪 ›</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h3 className="section__title">管理</h3>
        <div className="manage-list">
          <button
            type="button"
            className="manage-item"
            onClick={() => {
              loadListingIntoDraft(listing);
              const sku =
                listing.kind === 'group'
                  ? 'group'
                  : listing.kind === 'companion'
                    ? 'companion'
                    : listing.form;
              navigate(`/profile/my-moments/launch/product?sku=${sku}`);
            }}
          >
            <span>
              <strong>
                {listing.kind === 'group'
                  ? '活动信息与履约设置'
                  : '商品、价格与营业时间'}
              </strong>
              <small>编辑后会进入预览再保存</small>
            </span>
            <span>›</span>
          </button>
          {listing.status === 'open' && (
            <Link to={buyerPath} className="manage-item">
              <span>
                <strong>查看买家页面</strong>
                <small>确认市集展示和可约状态</small>
              </span>
              <span>›</span>
            </Link>
          )}
        </div>
      </section>

      <section className="section danger-zone">
        <h3 className="section__title">
          {listing.status === 'open' ? '停止销售' : '重新销售'}
        </h3>
        <p className="muted">
          {listing.status === 'open'
            ? '下架后买家将无法在市集看到，历史订单仍保留。'
            : '重新上架后，买家会再次在市集看到该 Moment。'}
        </p>
        <button
          type="button"
          className={
            listing.status === 'open'
              ? 'btn btn--danger btn--block'
              : 'btn btn--primary btn--block'
          }
          onClick={() => {
            const next = listing.status === 'open' ? 'offline' : 'open';
            if (
              next === 'open' ||
              window.confirm('确认下架这个 Moment？历史订单不会删除。')
            ) {
              setSupplyStatus(listing.id, next);
            }
          }}
        >
          {listing.status === 'open' ? '确认下架' : '重新上架'}
        </button>
      </section>
    </div>
  );
}
