import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getMoment, getProvider } from '../data/catalog';
import { buyerAvailability } from '../data/mock';
import { useOrders } from '../state/orderStore';
import { useSupplyTick } from '../state/supplyStore';

export function DetailPage() {
  useSupplyTick();
  useOrders();
  const { momentId = '' } = useParams();
  const navigate = useNavigate();
  const moment = getMoment(momentId);

  if (!moment) {
    return (
      <div className="page">
        <PageHeader title="Moment 详情" backTo="/" />
        <p className="empty">未找到该 Moment</p>
      </div>
    );
  }

  const provider = getProvider(moment.providerId);
  if (!provider) {
    return (
      <div className="page">
        <PageHeader title="Moment 详情" backTo="/" />
        <p className="empty">供给方不存在</p>
      </div>
    );
  }

  const avail = buyerAvailability(moment);

  return (
    <div className="page">
      <PageHeader title="Moment 详情" backTo="/" />

      <div className="detail-hero">
        <div className="avatar avatar--lg" style={{ background: provider.avatarColor }}>
          {provider.name.slice(0, 1)}
        </div>
        <div>
          <div className="moment-card__row">
            <strong>{provider.name}</strong>
            {provider.verified && <span className="badge">已认证</span>}
          </div>
          <p className="muted">{provider.bio}</p>
          <div className="moment-card__trust" style={{ marginTop: 6 }}>
            <span className="trust-chip muted-chip">已履约 {moment.fulfilledCount}</span>
            {moment.avgResponseMin > 0 && (
              <span className="trust-chip muted-chip">
                平均响应时长 {moment.avgResponseMin} 分钟
              </span>
            )}
          </div>
        </div>
      </div>

      <h2 className="detail-title">{moment.title}</h2>
      <div className="meta-row">
        <span className="pill">{moment.sceneTag}</span>
        <span>时长 {moment.durationSec} 秒</span>
        <span>¥{moment.priceYuan.toFixed(1)}</span>
      </div>
      <p className="body-text">{moment.description}</p>

      <section className="section">
        <h3 className="section__title">可约情况</h3>
        <div className="soft-card soft-card--static">
          {avail.kind === 'now' && (
            <p>
              <strong>
                {moment.avgResponseMin > 0
                  ? `尽快 · 平均响应时长 ${avail.waitMin} 分钟内开始`
                  : '尽快 · 新发布'}
              </strong>
              <br />
              <span className="muted">付款后超时未接自动退款</span>
            </p>
          )}
          {avail.kind === 'slot' && (
            <p>
              <strong>可预约 · 最早 {avail.earliestLabel}</strong>
              <br />
              <span className="muted">选好时间，到点履约</span>
            </p>
          )}
          {avail.kind === 'now' && moment.slots.some((s) => s.remaining > 0) && (
            <p className="muted">也可以预约档期，下单时选择时间</p>
          )}
          {avail.kind === 'full' && <p>已约满，晚点再来看看</p>}
        </div>
      </section>

      <section className="section">
        <h3 className="section__title">履约须知</h3>
        <ul className="rules">
          <li>尽快：付款后等待对方接单，超时自动退款。</li>
          <li>预约：购买即锁定所选时间，到点进等待室。</li>
          <li>本 Demo 为网页模拟，不产生真实扣款与通话。</li>
        </ul>
      </section>

      <div className="bottom-cta">
        <div>
          <div className="muted">
            {avail.kind === 'now' &&
              (moment.avgResponseMin > 0
                ? `平均响应时长 ${avail.waitMin} 分钟内开始`
                : '新发布 · 等待 TA 接单')}
            {avail.kind === 'slot' && `最早 ${avail.earliestLabel}`}
            {avail.kind === 'full' && '已约满'}
          </div>
          <strong>¥{moment.priceYuan.toFixed(1)}</strong>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={avail.kind === 'full'}
          onClick={() => navigate(`/checkout/${moment.id}`)}
        >
          去下单
        </button>
      </div>

      <p className="footer-note">
        也可先去 <Link to={`/ta/${provider.id}`}>TA 的 Moment</Link> 查看主页。
      </p>
    </div>
  );
}
