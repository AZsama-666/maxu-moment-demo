import { Link } from 'react-router-dom';
import type { PersonListing, TransferListing } from '../data/marketMock';

export function PersonCard({ person }: { person: PersonListing }) {
  const waitLabel = person.earliestLabel
    ? `最早 ${person.earliestLabel} 可约`
    : person.hasGroup
      ? '可组局 / 陪玩'
      : '看看 TA 的 Moment';

  return (
    <Link to={`/ta/${person.providerId}`} className="moment-card">
      <div
        className="moment-card__cover"
        style={
          person.avatarUrl
            ? undefined
            : {
                background: `linear-gradient(160deg, ${person.avatarColor} 0%, ${person.avatarColor}cc 45%, #1a2332 100%)`,
              }
        }
        aria-hidden
      >
        {person.avatarUrl ? (
          <img className="moment-card__cover-img" src={person.avatarUrl} alt="" />
        ) : (
          <span className="moment-card__cover-letter">{person.name.slice(0, 1)}</span>
        )}
      </div>
      <div className="moment-card__body">
        <div className="moment-card__row">
          <strong>{person.name}</strong>
          {person.verified && <span className="badge">已认证</span>}
          <span className="moment-card__wait">{waitLabel}</span>
        </div>
        <div className="moment-card__title">进主页选 Moment</div>
        <div className="moment-card__meta">
          <span>{person.offerTags.join(' · ') || 'Moment'}</span>
        </div>
        <div className="moment-card__trust">
          {person.offerTags.map((tag) => (
            <span key={tag} className="trust-chip muted-chip">
              {tag}
            </span>
          ))}
          {person.within15Min && (
            <span className="trust-chip">15分钟内</span>
          )}
        </div>
        <div className="moment-card__price">
          从 ¥{person.fromPriceYuan.toFixed(person.fromPriceYuan % 1 ? 1 : 0)}
        </div>
      </div>
    </Link>
  );
}

export function GroupCard({ listing }: { listing: import('../data/marketMock').GroupListing }) {
  return (
    <Link to={`/group/${listing.id}`} className="moment-card">
      <div
        className="moment-card__cover"
        style={
          listing.avatarUrl
            ? undefined
            : {
                background: `linear-gradient(160deg, ${listing.avatarColor} 0%, ${listing.avatarColor}cc 45%, #1a2332 100%)`,
              }
        }
        aria-hidden
      >
        {listing.avatarUrl ? (
          <img className="moment-card__cover-img" src={listing.avatarUrl} alt="" />
        ) : (
          <span className="moment-card__cover-letter">{listing.hostName.slice(0, 1)}</span>
        )}
      </div>
      <div className="moment-card__body">
        <div className="moment-card__row">
          <strong>{listing.hostName}</strong>
          <span className="moment-card__wait muted">{listing.whenLabel}</span>
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
          <span className="trust-chip">{listing.sceneTag}</span>
          <span className="trust-chip muted-chip">线下交割</span>
        </div>
        <div className="moment-card__price">¥{listing.priceYuan.toFixed(0)}</div>
      </div>
    </Link>
  );
}

export function TransferCard({ listing }: { listing: TransferListing }) {
  return (
    <Link to={`/transfer/${listing.id}`} className="moment-card moment-card--transfer">
      <div className="moment-card__body moment-card__body--transfer">
        <div className="moment-card__row">
          <span className="avatar avatar--transfer">转</span>
          <strong>{listing.title}</strong>
        </div>
        <p className="muted">{listing.ruleHint}</p>
        <span className="moment-card__wait">{listing.statusLabel}</span>
      </div>
    </Link>
  );
}
