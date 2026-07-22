import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProvider } from '../data/catalog';
import { providerHeroUrl } from '../data/mock';
import { getGroupListing, isOnlineGroupPlace, formatRefundPolicySummary } from '../data/marketMock';
import { createGroupOrder } from '../state/groupOrderStore';

export function GroupDetailPage() {
  const { groupId = '' } = useParams();
  const navigate = useNavigate();
  const listing = getGroupListing(groupId);
  const [error, setError] = useState('');

  if (!listing) {
    return (
      <div className="page">
        <div className="page-header">
          <Link to="/" className="page-header__back" aria-label="返回">
            ‹
          </Link>
          <h1>组局详情</h1>
          <span className="page-header__spacer" />
        </div>
        <p className="empty">未找到该组局</p>
      </div>
    );
  }

  const host = getProvider(listing.hostProviderId);
  const coverUrl =
    listing.coverImageUrl ??
    (host ? providerHeroUrl(host) : listing.avatarUrl);
  const online = isOnlineGroupPlace(listing.placeLabel);
  const introText = listing.intro ?? listing.description;
  const hostIntroText = listing.hostIntro ?? host?.bio;
  const participantAvatars = listing.participantAvatars ?? [];

  return (
    <div className="page page--detail page--group-detail">
      <div
        className="detail-cover detail-cover--activity"
        style={
          coverUrl
            ? undefined
            : {
                background: `linear-gradient(165deg, ${listing.avatarColor} 0%, ${listing.avatarColor}b8 38%, #0f172a 100%)`,
              }
        }
      >
        {coverUrl && (
          <img className="detail-cover__img" src={coverUrl} alt="" />
        )}
        <Link to="/" className="detail-cover__back" aria-label="返回">
          ‹
        </Link>
        <div className="detail-cover__shade" aria-hidden />
        {!coverUrl && (
          <div className="detail-cover__letter" aria-hidden>
            {listing.title.slice(0, 1)}
          </div>
        )}
        <div className="detail-cover__info">
          <div className="detail-cover__name-row">
            <strong>{listing.title}</strong>
            <span className="badge badge--on-dark">
              {online ? '线上开黑' : '线下见面'}
            </span>
          </div>
          <p className="detail-cover__bio">
            {listing.whenLabel} · {listing.placeLabel}
            {listing.distanceLabel ? ` · ${listing.distanceLabel}` : ''}
          </p>
          <div className="detail-cover__stats">
            <span>剩 {listing.seatsLeft} 席</span>
            {listing.joinedCount > 0 && (
              <span>已有 {listing.joinedCount} 人报名</span>
            )}
            <span>双方确认交割</span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="meta-row">
          <span className="pill">组局</span>
          <span>¥{listing.priceYuan.toFixed(0)}</span>
          {listing.distanceLabel && <span>{listing.distanceLabel}</span>}
        </div>

        <section className="group-detail-section">
          <h3 className="section__title">活动简介</h3>
          <p className="body-text">{introText}</p>
        </section>

        {listing.contentSections && listing.contentSections.length > 0 && (
          <section className="group-detail-section">
            <h3 className="section__title">活动内容</h3>
            {listing.contentSections.map((section) => (
              <div key={section.title} className="group-detail-section__block">
                <h4 className="group-detail-section__subtitle">
                  {section.title}
                </h4>
                <p className="body-text group-detail-section__body">
                  {section.body}
                </p>
              </div>
            ))}
          </section>
        )}

        {listing.joinedCount > 0 && (
          <section className="group-detail-section">
            <h3 className="section__title">已报名</h3>
            <div className="group-detail-joined">
              {participantAvatars.length > 0 && (
                <div className="avatar-stack" aria-hidden>
                  {participantAvatars.slice(0, 3).map((url, i) => (
                    <img
                      key={`${listing.id}-p-${i}`}
                      className="avatar-stack__item"
                      src={url}
                      alt=""
                    />
                  ))}
                </div>
              )}
              <span className="muted">已有 {listing.joinedCount} 人报名</span>
            </div>
          </section>
        )}

        {host && (
          <section className="group-detail-section">
            <h3 className="section__title">主理人</h3>
            <div className="group-detail-host soft-card soft-card--static">
              <div className="group-detail-host__head">
                <div
                  className="group-detail-host__avatar"
                  style={
                    host.avatarUrl ? undefined : { background: host.avatarColor }
                  }
                >
                  {host.avatarUrl ? (
                    <img src={host.avatarUrl} alt="" />
                  ) : (
                    <span>{listing.hostName.slice(0, 1)}</span>
                  )}
                </div>
                <div className="group-detail-host__meta">
                  <div className="group-detail-host__name-row">
                    <strong>{listing.hostName}</strong>
                    {host.verified && (
                      <span className="badge">已认证</span>
                    )}
                    {listing.hostBadge && (
                      <span className="pill pill--sm">{listing.hostBadge}</span>
                    )}
                  </div>
                  {listing.hostOrganizedCount != null &&
                    listing.hostOrganizedCount > 0 && (
                      <p className="group-detail-host__stat">
                        已成功组织 {listing.hostOrganizedCount} 场
                      </p>
                    )}
                </div>
              </div>
              {hostIntroText && (
                <p className="body-text group-detail-host__bio">{hostIntroText}</p>
              )}
              <div className="group-detail-host__links">
                <Link
                  to={`/messages/dm/${host.id}`}
                  className="btn btn--ghost btn--sm"
                >
                  咨询主理人
                </Link>
                <Link to={`/ta/${host.id}`} className="text-link">
                  查看 TA 主页
                </Link>
              </div>
              {listing.hostWechatId && (
                <p className="muted group-detail-host__wechat-hint">
                  主理人微信：付款后可查看
                </p>
              )}
            </div>
          </section>
        )}

        <div className="rules-bar group-detail-section">
          <p>
            平台保障：付款后进入待双方确认；非 1V1 平台通话，到场/服务完成后各自确认交割。
          </p>
        </div>

        <section className="group-detail-section section">
          <h3 className="section__title">履约说明</h3>
          <ul className="rules">
            <li>付款后进入「待双方确认」。</li>
            <li>到场/服务完成后，买家与供给方各自确认收货交割。</li>
            <li>双方都确认后订单完成。平台不代履约 1V1 通话。</li>
          </ul>
        </section>

        {error && <p className="error">{error}</p>}

        {listing.refundPolicy && (
          <section className="group-detail-section">
            <h3 className="section__title">退改规则</h3>
            <div className="group-refund-card soft-card soft-card--static">
              <p className="body-text">
                {formatRefundPolicySummary(listing.refundPolicy)}
              </p>
            </div>
          </section>
        )}

        <div className="bottom-cta">
          <div>
            <div className="muted">
              {listing.whenLabel} · 剩 {listing.seatsLeft} 席 · 双方确认交割
            </div>
            <strong>¥{listing.priceYuan.toFixed(0)}</strong>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              const order = createGroupOrder(listing.id);
              if (!order) {
                setError('报名失败，名额不足');
                return;
              }
              navigate(`/group-pay/${order.id}`);
            }}
          >
            报名下单
          </button>
        </div>
      </div>
    </div>
  );
}
