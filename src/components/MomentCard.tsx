import { Link } from 'react-router-dom';
import { getProvider } from '../data/catalog';
import { buyerAvailability, type MomentItem } from '../data/mock';
import { useOrders } from '../state/orderStore';
import { useSupplyTick } from '../state/supplyStore';

export function MomentCard({ moment }: { moment: MomentItem }) {
  useSupplyTick();
  useOrders();
  const provider = getProvider(moment.providerId);
  const avail = buyerAvailability(moment);

  if (!provider) return null;

  return (
    <Link to={`/moment/${moment.id}`} className="moment-card">
      <div
        className="avatar"
        style={{ background: provider.avatarColor }}
        aria-hidden
      >
        {provider.name.slice(0, 1)}
      </div>
      <div className="moment-card__body">
        <div className="moment-card__row">
          <strong>{provider.name}</strong>
          {provider.verified && <span className="badge">已认证</span>}
          <span className="moment-card__wait">
            {avail.kind === 'now' &&
              (moment.avgResponseMin > 0
                ? `平均响应时长${avail.waitMin}分钟`
                : '新发布')}
            {avail.kind === 'slot' && `最早 ${avail.earliestLabel}`}
            {avail.kind === 'full' && '已约满'}
          </span>
        </div>
        <div className="moment-card__title">{moment.title}</div>
        <div className="moment-card__meta">
          <span>{moment.sceneTag}</span>
          <span>·</span>
          <span>{moment.durationSec} 秒</span>
          <span>·</span>
          <span>已履约 {moment.fulfilledCount}</span>
        </div>
        <div className="moment-card__trust">
          <span className="trust-chip muted-chip">1V1</span>
          {avail.kind === 'now' && <span className="trust-chip">尽快</span>}
          {avail.kind === 'slot' && <span className="trust-chip">可预约</span>}
          {avail.kind === 'full' && <span className="trust-chip muted-chip">已约满</span>}
          <span className="trust-chip muted-chip">
            {moment.form === 'voice' ? '语音' : '视频'}
          </span>
        </div>
        <div className="moment-card__price">¥{moment.priceYuan.toFixed(1)}</div>
      </div>
    </Link>
  );
}
