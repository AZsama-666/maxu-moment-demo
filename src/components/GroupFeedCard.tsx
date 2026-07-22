import { Link } from 'react-router-dom';

export type GroupFeedCardProps = {
  to: string;
  coverUrl?: string;
  coverColor: string;
  coverLetter: string;
  mediaLabel?: string;
  mediaAvatars?: string[];
  title: string;
  timeLabel: string;
  locationLabel: string;
  hostName: string;
  hostAvatarUrl?: string;
  hostColor: string;
  hostTag?: string;
  priceLabel: string;
  ctaLabel: string;
};

function ClockIcon() {
  return (
    <svg className="group-feed-card__icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 4.5V8l2.2 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="group-feed-card__icon" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 1.8c-2.2 0-4 1.6-4 3.6 0 2.8 4 7.8 4 7.8s4-5 4-7.8c0-2-1.8-3.6-4-3.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="5.4" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function GroupFeedCard({
  to,
  coverUrl,
  coverColor,
  coverLetter,
  mediaLabel,
  mediaAvatars = [],
  title,
  timeLabel,
  locationLabel,
  hostName,
  hostAvatarUrl,
  hostColor,
  hostTag,
  priceLabel,
  ctaLabel,
}: GroupFeedCardProps) {
  const visibleAvatars = mediaAvatars.slice(0, 3);
  const showJoined = visibleAvatars.length > 0 || Boolean(mediaLabel);

  return (
    <Link to={to} className="group-feed-card">
      <div className="group-feed-card__media">
        <div
          className="group-feed-card__cover"
          style={
            coverUrl
              ? undefined
              : {
                  background: `linear-gradient(165deg, ${coverColor} 0%, ${coverColor}99 55%, #1a2332 100%)`,
                }
          }
        >
          {coverUrl ? (
            <img className="group-feed-card__cover-img" src={coverUrl} alt="" />
          ) : (
            <span className="group-feed-card__cover-letter">{coverLetter}</span>
          )}
        </div>
        {showJoined && (
          <div className="group-feed-card__joined">
            {visibleAvatars.length > 0 && (
              <div className="group-feed-card__avatar-stack" aria-hidden>
                {visibleAvatars.map((url, i) => (
                  <img
                    key={`${to}-p-${i}`}
                    className="group-feed-card__avatar-stack-item"
                    src={url}
                    alt=""
                  />
                ))}
              </div>
            )}
            {mediaLabel && <span>{mediaLabel}</span>}
          </div>
        )}
      </div>

      <div className="group-feed-card__body">
        <h3 className="group-feed-card__title">{title}</h3>

        <div className="group-feed-card__meta">
          <div className="group-feed-card__meta-row">
            <ClockIcon />
            <span>{timeLabel}</span>
          </div>
          <div className="group-feed-card__meta-row">
            <PinIcon />
            <span>{locationLabel}</span>
          </div>
        </div>

        <div className="group-feed-card__footer">
          <div className="group-feed-card__host">
            <div
              className="group-feed-card__host-avatar"
              style={hostAvatarUrl ? undefined : { background: hostColor }}
            >
              {hostAvatarUrl ? (
                <img src={hostAvatarUrl} alt="" />
              ) : (
                <span>{hostName.slice(0, 1)}</span>
              )}
            </div>
            <span className="group-feed-card__host-name">{hostName}</span>
            {hostTag && <span className="group-feed-card__host-tag">{hostTag}</span>}
          </div>
          <div className="group-feed-card__action">
            <span className="group-feed-card__price">{priceLabel}</span>
            <span className="group-feed-card__cta">{ctaLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
