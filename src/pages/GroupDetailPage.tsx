import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getGroupListing } from '../data/marketMock';
import { createGroupOrder } from '../state/groupOrderStore';

export function GroupDetailPage() {
  const { groupId = '' } = useParams();
  const navigate = useNavigate();
  const listing = getGroupListing(groupId);
  const [error, setError] = useState('');

  if (!listing) {
    return (
      <div className="page">
        <PageHeader title="组局详情" backTo="/" />
        <p className="empty">未找到该组局</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="组局 / 陪玩" backTo="/" />

      <div className="detail-hero">
        <div
          className="avatar avatar--lg"
          style={{ background: listing.avatarColor }}
        >
          {listing.hostName.slice(0, 1)}
        </div>
        <div>
          <strong>{listing.hostName}</strong>
          <p className="muted">
            {listing.whenLabel} · {listing.placeLabel}
          </p>
          <p className="pill">线下交割 · 双方确认</p>
        </div>
      </div>

      <h2 className="detail-title">{listing.title}</h2>
      <div className="meta-row">
        <span className="pill">{listing.sceneTag}</span>
        <span>剩 {listing.seatsLeft} 席</span>
        <span>¥{listing.priceYuan.toFixed(0)}</span>
      </div>
      <p className="body-text">{listing.description}</p>

      <section className="section">
        <h3 className="section__title">履约说明</h3>
        <ul className="rules">
          <li>付款后进入「待双方确认」。</li>
          <li>到场/服务完成后，买家与供给方各自确认收货交割。</li>
          <li>双方都确认后订单完成。平台不代履约 1V1 通话。</li>
        </ul>
      </section>

      {error && <p className="error">{error}</p>}

      <div className="bottom-cta">
        <div>
          <div className="muted">{listing.whenLabel}</div>
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
            navigate(`/group-order/${order.id}`);
          }}
        >
          报名下单
        </button>
      </div>
    </div>
  );
}
