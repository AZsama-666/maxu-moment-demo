import { Link } from 'react-router-dom';
import { getProvider } from '../data/catalog';
import { buyerAvailability, type MomentItem } from '../data/mock';
import { getRemainingStock } from '../state/orderStore';
import { useSupplyTick } from '../state/supplyStore';

export function MomentCard({ moment }: { moment: MomentItem }) {
  useSupplyTick();
  const provider = getProvider(moment.providerId);
  const avail = buyerAvailability(moment, new Date(), getRemainingStock);

  if (!provider) return null;

  return (
    <Link to={`/moment/${moment.id}`} className="moment-card">
      <div
        className="moment-card__cover"
        style={
          provider.avatarUrl
            ? undefined
            : {
                background: `linear-gradient(160deg, ${provider.avatarColor} 0%, ${provider.avatarColor}cc 45%, #1a2332 100%)`,
              }
        }
        aria-hidden
      >
        {provider.avatarUrl ? (
          <img
            className="moment-card__cover-img"
            src={provider.avatarUrl}
            alt=""
          />
        ) : (
          <span className="moment-card__cover-letter">{provider.name.slice(0, 1)}</span>
        )}
      </div>
      <div className="moment-card__body">
        <div className="moment-card__row">
          <strong>{provider.name}</strong>
          {provider.verified && <span className="badge">已认证</span>}
          <span className="moment-card__wait">
            {avail.kind === 'available'
              ? `最早 ${avail.earliestLabel} 可约`
              : '已约满'}
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
          {avail.kind === 'available' && (
            <span className="trust-chip">可预约</span>
          )}
          {avail.kind === 'full' && (
            <span className="trust-chip muted-chip">已约满</span>
          )}
          <span className="trust-chip muted-chip">
            {moment.form === 'voice' ? '语音' : '视频'}
          </span>
        </div>
        <div className="moment-card__price">¥{moment.priceYuan.toFixed(1)}</div>
      </div>
    </Link>
  );
}
