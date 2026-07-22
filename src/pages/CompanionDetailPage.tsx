import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProvider } from '../data/catalog';
import { providerHeroUrl } from '../data/mock';
import { getCompanionListing, isOnlineGroupPlace } from '../data/marketMock';
import { createGroupOrder } from '../state/groupOrderStore';

export function CompanionDetailPage() {
  const { companionId = '' } = useParams();
  const navigate = useNavigate();
  const listing = getCompanionListing(companionId);
  const [error, setError] = useState('');

  if (!listing) {
    return (
      <div className="page">
        <div className="page-header">
          <Link to="/" className="page-header__back" aria-label="返回">
            ‹
          </Link>
          <h1>陪玩详情</h1>
          <span className="page-header__spacer" />
        </div>
        <p className="empty">未找到该陪玩服务</p>
      </div>
    );
  }

  const provider = getProvider(listing.providerId);
  const heroUrl = provider
    ? providerHeroUrl(provider)
    : listing.avatarUrl;
  const online = isOnlineGroupPlace(listing.placeLabel);

  return (
    <div className="page page--detail">
      <div
        className="detail-cover"
        style={
          heroUrl
            ? undefined
            : {
                background: `linear-gradient(165deg, ${listing.avatarColor} 0%, ${listing.avatarColor}b8 38%, #0f172a 100%)`,
              }
        }
      >
        {heroUrl && (
          <img className="detail-cover__img" src={heroUrl} alt="" />
        )}
        <Link
          to={provider ? `/ta/${provider.id}` : '/'}
          className="detail-cover__back"
          aria-label="返回"
        >
          ‹
        </Link>
        <div className="detail-cover__shade" aria-hidden />
        {!heroUrl && (
          <div className="detail-cover__letter" aria-hidden>
            {listing.providerName.slice(0, 1)}
          </div>
        )}
        <div className="detail-cover__info">
          <div className="detail-cover__name-row">
            <strong>{listing.providerName}</strong>
            {provider?.verified && (
              <span className="badge badge--on-dark">已认证</span>
            )}
            <span className="badge badge--on-dark">
              {online ? '线上' : '线下'}
            </span>
          </div>
          <p className="detail-cover__bio">
            {listing.whenLabel} · {listing.placeLabel}
          </p>
          <div className="detail-cover__stats">
            <span>1V1 陪玩</span>
            <span>剩 {listing.remaining} 份</span>
            <span>双方确认交割</span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <h2 className="detail-title">{listing.title}</h2>
        <div className="meta-row">
          <span className="pill">陪玩</span>
          <span>剩 {listing.remaining} 份</span>
          <span>¥{listing.priceYuan.toFixed(0)}</span>
        </div>
        <p className="body-text">{listing.description}</p>

        <div className="rules-bar" style={{ marginBottom: 16 }}>
          <p>
            平台保障：付款后进入待双方确认；陪玩属于 1V1 服务，完成后各自确认交割（非平台内通话履约）。
          </p>
        </div>

        <section className="section">
          <h3 className="section__title">履约说明</h3>
          <ul className="rules">
            <li>付款后进入「待双方确认」。</li>
            <li>按约定完成陪玩服务后，买家与供给方各自确认交割。</li>
            <li>双方都确认后订单完成。平台不代履约 1V1 通话。</li>
          </ul>
        </section>

        {error && <p className="error">{error}</p>}

        <div className="bottom-cta">
          <div>
            <div className="muted">
              {listing.whenLabel} · 剩 {listing.remaining} 份 · 双方确认交割
            </div>
            <strong>¥{listing.priceYuan.toFixed(0)}</strong>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              const order = createGroupOrder(listing.id);
              if (!order) {
                setError('下单失败，名额不足');
                return;
              }
              navigate(`/group-order/${order.id}`);
            }}
          >
            立即下单
          </button>
        </div>
      </div>
    </div>
  );
}
