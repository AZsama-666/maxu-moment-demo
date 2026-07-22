import { Link, Navigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PageHeader } from '../components/PageHeader';
import { getProvider, listMomentsByProvider } from '../data/catalog';
import { GroupActivityFeed } from '../components/GroupActivityFeed';
import { GroupCard, CompanionCard, PersonCard } from '../components/MarketCards';
import { MomentCard } from '../components/MomentCard';
import {
  filterMarketItems,
  listCompanionsByProvider,
  listGroupsByProvider,
  listMarketItems,
} from '../data/marketMock';
import { categories, providerHeroUrl, type CategoryKey } from '../data/mock';
import { useOpenSupplyMoments } from '../state/supplyStore';

export function PlaceholderPage({
  title,
  message,
  extra,
}: {
  title: string;
  message: string;
  extra?: ReactNode;
}) {
  return (
    <div className="page">
      <PageHeader title={title} backTo="/" />
      <div className="soft-card soft-card--static">
        <p>{message}</p>
        <p className="muted">本 Demo 跑通市集混排：按人进入后选择 SKU。</p>
        {extra}
        <Link to="/" className="btn btn--primary btn--block">
          回到 Moment
        </Link>
      </div>
    </div>
  );
}

export function PublishPage() {
  return (
    <PlaceholderPage
      title="发布"
      message="发布用于发动态，不承接 Moment 配置。"
      extra={
        <Link
          to="/profile/my-moments/launch/type"
          className="btn btn--ghost btn--block"
        >
          发起自己的 Moment
        </Link>
      }
    />
  );
}

export function CategoryPage() {
  useOpenSupplyMoments();
  const { key = '' } = useParams();

  if (key === 'screen') {
    return <Navigate to="/" replace />;
  }

  const cat = categories.find((c) => c.key === key);
  if (!cat) {
    return <PlaceholderPage title="分类" message="未找到该分类。" />;
  }

  if (key === 'group') {
    return (
      <div className="page">
        <PageHeader title={cat.label} backTo="/" />
        <GroupActivityFeed />
      </div>
    );
  }

  const people = filterMarketItems(listMarketItems(), key as CategoryKey, false);

  return (
    <div className="page">
      <PageHeader title={cat.label} backTo="/" />
      <p className="section__desc">{cat.hint} · 先选人，再选具体 Moment</p>
      <div className="stack">
        {people.length === 0 ? (
          <p className="empty">该分类暂无供给</p>
        ) : (
          people.map((p) => <PersonCard key={p.providerId} person={p} />)
        )}
      </div>
    </div>
  );
}

export function TaMomentPage() {
  useOpenSupplyMoments();
  const { providerId = '' } = useParams();
  const provider = getProvider(providerId);
  const moments = listMomentsByProvider(providerId);
  const groups = listGroupsByProvider(providerId);
  const companions = listCompanionsByProvider(providerId);

  if (!provider) {
    return (
      <div className="page">
        <PageHeader title="TA 的 Moment" backTo="/" />
        <p className="empty">用户不存在</p>
      </div>
    );
  }

  const hasAny =
    moments.length > 0 || groups.length > 0 || companions.length > 0;
  const heroUrl = providerHeroUrl(provider);

  return (
    <div className="page page--detail">
      <div
        className="detail-cover"
        style={
          heroUrl
            ? undefined
            : {
                background: `linear-gradient(165deg, ${provider.avatarColor} 0%, ${provider.avatarColor}b8 38%, #0f172a 100%)`,
              }
        }
      >
        {heroUrl && (
          <img className="detail-cover__img" src={heroUrl} alt="" />
        )}
        <Link to="/" className="detail-cover__back" aria-label="返回">
          ‹
        </Link>
        <div className="detail-cover__shade" aria-hidden />
        {!heroUrl && (
          <div className="detail-cover__letter" aria-hidden>
            {provider.name.slice(0, 1)}
          </div>
        )}
        <div className="detail-cover__info">
          <div className="detail-cover__name-row">
            <strong>{provider.name}</strong>
            {provider.verified && (
              <span className="badge badge--on-dark">已认证</span>
            )}
          </div>
          <p className="detail-cover__bio">{provider.bio}</p>
          <div className="detail-cover__stats">
            <span>
              {hasAny
                ? `${moments.length + companions.length + groups.length} 个可约 Moment`
                : '暂无开放'}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <p className="section__desc" style={{ marginTop: 0 }}>
          选择一种 Moment 继续
        </p>

        {moments.length > 0 && (
          <section className="section">
            <h3 className="section__title">1V1</h3>
            <div className="stack">
              {moments.map((m) => (
                <MomentCard key={m.id} moment={m} />
              ))}
            </div>
          </section>
        )}

        {companions.length > 0 && (
          <section className="section">
            <h3 className="section__title">陪玩</h3>
            <p className="section__desc muted" style={{ marginTop: -8 }}>
              1V1 服务 · 完成后双方确认交割
            </p>
            <div className="stack">
              {companions.map((c) => (
                <CompanionCard key={c.id} listing={c} />
              ))}
            </div>
          </section>
        )}

        {groups.length > 0 && (
          <section className="section">
            <h3 className="section__title">组局</h3>
            <p className="section__desc muted" style={{ marginTop: -8 }}>
              主理人召集 · 报名后双方确认交割
            </p>
            <div className="stack">
              {groups.map((g) => (
                <GroupCard key={g.id} listing={g} />
              ))}
            </div>
          </section>
        )}

        {!hasAny && <p className="empty">暂无开放的 Moment</p>}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <PlaceholderPage title="页面不存在" message="链接无效，请从 Moment 首页重新进入。" />
  );
}
