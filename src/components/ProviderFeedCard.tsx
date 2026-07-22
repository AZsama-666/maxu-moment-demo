import { Link } from 'react-router-dom';

export type ProviderFeedCardProps = {
  to: string;
  coverUrl?: string;
  coverColor: string;
  coverLetter: string;
  title: string;
  /** 合并后的第二行：时间 · 履约方式 */
  metaLabel: string;
  tags?: string[];
  priceLabel: string;
  ctaLabel: string;
};

export function ProviderFeedCard({
  to,
  coverUrl,
  coverColor,
  coverLetter,
  title,
  metaLabel,
  tags = [],
  priceLabel,
  ctaLabel,
}: ProviderFeedCardProps) {
  return (
    <Link to={to} className="provider-feed-card">
      <div
        className="provider-feed-card__cover"
        style={
          coverUrl
            ? undefined
            : {
                background: `linear-gradient(165deg, ${coverColor} 0%, ${coverColor}99 55%, #1a2332 100%)`,
              }
        }
      >
        {coverUrl ? (
          <img className="provider-feed-card__cover-img" src={coverUrl} alt="" />
        ) : (
          <span className="provider-feed-card__cover-letter">{coverLetter}</span>
        )}
      </div>

      <div className="provider-feed-card__body">
        <h3 className="provider-feed-card__title">{title}</h3>
        <p className="provider-feed-card__meta">{metaLabel}</p>
        <div className="provider-feed-card__action">
          <div className="provider-feed-card__tags">
            {tags.map((tag) => (
              <span key={tag} className="provider-feed-card__tag">
                {tag}
              </span>
            ))}
            <span className="provider-feed-card__price">{priceLabel}</span>
          </div>
          <span className="provider-feed-card__cta">{ctaLabel}</span>
        </div>
      </div>
    </Link>
  );
}
