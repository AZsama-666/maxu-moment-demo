import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { loadListingIntoDraft } from '../state/launchDraftStore';
import { ASAP_SLA_MIN } from '../state/orderStore';
import {
  getSupplyListing,
  setSupplyStatus,
  updateSupplyMoment,
  useSupplyListings,
} from '../state/supplyStore';

export function SupplyManagePage() {
  useSupplyListings();
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
    listing.kind === 'companion' ? `/group/${listing.id}` : `/moment/${listing.id}`;

  return (
    <div className="page">
      <PageHeader title="管理 Moment" backTo="/profile/my-moments" />

      <div className="soft-card soft-card--static">
        <div className="section__head">
          <span className="pill">
            {listing.kind === 'companion'
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
          {listing.kind === 'companion'
            ? `${listing.unitLabel} · ${listing.serviceTime}`
            : `${listing.durationSec} 秒/份`}
          {' · '}¥{listing.priceYuan.toFixed(1)}
        </p>
      </div>

      {listing.kind === '1v1' && listing.asapEnabled && listing.status === 'open' && (
        <section className="section">
          <h3 className="section__title">实时接单</h3>
          <div className="manage-row">
            <span>
              <strong>{listing.acceptingPaused ? '已暂停' : '正在接单'}</strong>
              <small>
                {listing.acceptingPaused
                  ? '预约档期仍可被购买'
                  : `收到尽快单后需在 ${ASAP_SLA_MIN} 分钟内响应`}
              </small>
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() =>
                updateSupplyMoment(listing.id, {
                  acceptingPaused: !listing.acceptingPaused,
                })
              }
            >
              {listing.acceptingPaused ? '恢复实时接单' : '暂停实时接单'}
            </button>
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
              const sku = listing.kind === 'companion' ? 'companion' : listing.form;
              navigate(`/profile/my-moments/launch/product?sku=${sku}`);
            }}
          >
            <span>
              <strong>商品、价格与履约设置</strong>
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
