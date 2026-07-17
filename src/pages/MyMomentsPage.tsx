import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { isAcceptingNow } from '../data/mock';
import { useSupplyTasks } from '../state/supplyTasks';
import {
  useSupplyListings,
  type SupplyListing,
} from '../state/supplyStore';

export function MyMomentsPage() {
  const listings = useSupplyListings();
  const tasks = useSupplyTasks();
  const active = listings.filter((listing) => listing.status === 'open');
  const offline = listings.filter((listing) => listing.status === 'offline');

  return (
    <div className="page">
      <PageHeader title="我的 Moment" backTo="/profile" />

      {listings.length === 0 ? (
        <div className="supply-empty">
          <div className="supply-empty__icon">M</div>
          <h2>你还没有发起任何 Moment</h2>
          <p className="muted">可以开放 1V1 语音、视频或陪玩，让别人来约你。</p>
          <Link
            to="/profile/my-moments/launch/type"
            className="btn btn--primary btn--block"
          >
            发起第一个 Moment
          </Link>
        </div>
      ) : (
        <>
          <div className="supply-hub-head">
            <div>
              <strong>{active.length} 个正在销售</strong>
              <p className="muted">这里记录你发起过的供给 SKU</p>
            </div>
            <Link
              to="/profile/my-moments/launch/type"
              className="btn btn--primary btn--sm"
            >
              + 发起新的
            </Link>
          </div>

          {tasks.total > 0 && (
            <Link to="/profile/my-moments/tasks" className="supply-task-banner">
              <span>
                <strong>{tasks.total} 项待处理</strong>
                <small>实时订单、待履约或待确认交割</small>
              </span>
              <span>去处理 ›</span>
            </Link>
          )}

          {active.length > 0 && (
            <SupplySection title="正在销售" listings={active} tasks={tasks} />
          )}
          {offline.length > 0 && (
            <SupplySection title="已下架" listings={offline} tasks={tasks} />
          )}
        </>
      )}
    </div>
  );
}

function SupplySection({
  title,
  listings,
  tasks,
}: {
  title: string;
  listings: SupplyListing[];
  tasks: ReturnType<typeof useSupplyTasks>;
}) {
  return (
    <section className="section supply-list-section">
      <h3 className="section__title">{title}</h3>
      <div className="stack">
        {listings.map((listing) => (
          <SupplySkuCard key={listing.id} listing={listing} tasks={tasks} />
        ))}
      </div>
    </section>
  );
}

function SupplySkuCard({
  listing,
  tasks,
}: {
  listing: SupplyListing;
  tasks: ReturnType<typeof useSupplyTasks>;
}) {
  const pending1v1 =
    listing.kind === '1v1'
      ? tasks.pendingAccept.filter((order) => order.momentId === listing.id).length
      : 0;
  const pendingCompanion =
    listing.kind === 'companion'
      ? tasks.companionConfirm.filter(
          (order) => order.supplyListingId === listing.id,
        ).length
      : 0;

  let stateText = '';
  let action: { label: string; to: string } | null = null;

  if (listing.status === 'offline') {
    stateText = '已下架，买家暂时看不到';
    action = { label: '去管理', to: `/profile/my-moments/${listing.id}/manage` };
  } else if (pending1v1 > 0) {
    stateText = `有 ${pending1v1} 笔实时订单等待接单`;
    action = { label: '去接单', to: '/profile/my-moments/tasks' };
  } else if (pendingCompanion > 0) {
    stateText = `有 ${pendingCompanion} 笔服务等待确认交割`;
    action = { label: '去确认', to: '/profile/my-moments/tasks' };
  } else if (listing.kind === 'companion') {
    stateText = `${listing.serviceTime} · ${listing.placeLabel} · 剩 ${listing.remaining} 席`;
  } else if (isAcceptingNow(listing)) {
    stateText = '正在接实时订单，收到后请在 2 分钟内响应';
  } else if (listing.asapEnabled && listing.acceptingPaused) {
    stateText =
      listing.slots.length > 0
        ? '实时接单已暂停，预约档期仍可购买'
        : '实时接单已暂停';
    action = {
      label: '恢复实时接单',
      to: `/profile/my-moments/${listing.id}/manage`,
    };
  } else {
    stateText = `当前仅开放预约${listing.slots[0] ? ` · ${listing.slots[0].label}` : ''}`;
    action = {
      label: '管理档期',
      to: `/profile/my-moments/${listing.id}/manage`,
    };
  }

  const typeLabel =
    listing.kind === 'companion'
      ? '陪玩'
      : listing.form === 'voice'
        ? '1V1 语音'
        : '1V1 视频';
  const unit =
    listing.kind === 'companion'
      ? listing.unitLabel
      : `${listing.durationSec} 秒/份`;

  return (
    <article className="supply-sku-card">
      <div className="supply-sku-card__head">
        <span className="pill">{typeLabel}</span>
        <Link
          to={`/profile/my-moments/${listing.id}/manage`}
          className="text-link"
        >
          管理
        </Link>
      </div>
      <h3>{listing.title}</h3>
      <p className="muted">{unit} · ¥{listing.priceYuan.toFixed(1)}</p>
      <div className="supply-sku-state">
        <span className="supply-sku-state__dot" />
        <span>{stateText}</span>
      </div>
      {action && (
        <Link to={action.to} className="btn btn--primary btn--block">
          {action.label}
        </Link>
      )}
    </article>
  );
}
