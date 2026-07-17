import { Link } from 'react-router-dom';
import type { GroupListing, TransferListing } from '../data/marketMock';

export function GroupCard({ listing }: { listing: GroupListing }) {
  return (
    <Link to={`/group/${listing.id}`} className="moment-card">
      <div
        className="avatar"
        style={{ background: listing.avatarColor }}
        aria-hidden
      >
        {listing.hostName.slice(0, 1)}
      </div>
      <div className="moment-card__body">
        <div className="moment-card__row">
          <strong>{listing.hostName}</strong>
          <span className="moment-card__wait">{listing.whenLabel}</span>
        </div>
        <div className="moment-card__title">{listing.title}</div>
        <div className="moment-card__meta">
          <span>{listing.sceneTag}</span>
          <span>·</span>
          <span>{listing.placeLabel}</span>
          <span>·</span>
          <span>剩 {listing.seatsLeft} 席</span>
        </div>
        <div className="moment-card__trust">
          <span className="trust-chip">组局</span>
          <span className="trust-chip muted-chip">线下交割</span>
        </div>
        <div className="moment-card__price">¥{listing.priceYuan.toFixed(0)}</div>
      </div>
    </Link>
  );
}

export function TransferCard({ listing }: { listing: TransferListing }) {
  return (
    <Link to={`/transfer/${listing.id}`} className="moment-card">
      <div className="avatar avatar--transfer" aria-hidden>
        转
      </div>
      <div className="moment-card__body">
        <div className="moment-card__row">
          <strong>{listing.fromLabel}</strong>
          <span className="moment-card__wait muted">{listing.statusLabel}</span>
        </div>
        <div className="moment-card__title">{listing.title}</div>
        <div className="moment-card__meta">
          <span>{listing.ruleHint}</span>
        </div>
        <div className="moment-card__trust">
          <span className="trust-chip muted-chip">转约</span>
          <span className="trust-chip muted-chip">即将开放</span>
        </div>
      </div>
    </Link>
  );
}
