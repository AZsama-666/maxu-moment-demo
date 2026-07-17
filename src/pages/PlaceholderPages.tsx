import { Link, Navigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PageHeader } from '../components/PageHeader';
import { getProvider, listBrowseMoments, listMomentsByProvider } from '../data/catalog';
import { GroupCard, TransferCard } from '../components/MarketCards';
import { MomentCard } from '../components/MomentCard';
import {
  groupListings,
  transferListings,
} from '../data/marketMock';
import { categories, type CategoryKey } from '../data/mock';
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
        <p className="muted">本 Demo 跑通市集混排：1V1 平台履约、组局线下确认交割、转约占位。</p>
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
        <Link to="/profile/my-moments" className="btn btn--ghost btn--block">
          去「我的 Moment」挂单
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
    return (
      <PlaceholderPage title="分类" message="未找到该分类。" />
    );
  }

  if (key === '1v1') {
    const list = listBrowseMoments();
    return (
      <div className="page">
        <PageHeader title="1V1" backTo="/" />
        <p className="section__desc">平台履约 · 尽快 / 预约档期</p>
        <div className="stack">
          {list.map((m) => (
            <MomentCard key={m.id} moment={m} />
          ))}
        </div>
      </div>
    );
  }

  if (key === 'group') {
    return (
      <div className="page">
        <PageHeader title="组局 / 陪玩" backTo="/" />
        <p className="section__desc">线下履约 · 双方确认收货交割</p>
        <div className="stack">
          {groupListings.map((g) => (
            <GroupCard key={g.id} listing={g} />
          ))}
        </div>
      </div>
    );
  }

  if (key === 'transfer') {
    return (
      <div className="page">
        <PageHeader title="转约" backTo="/" />
        <p className="section__desc">规则占位，首期不开放交易</p>
        <div className="stack">
          {transferListings.map((t) => (
            <TransferCard key={t.id} listing={t} />
          ))}
        </div>
      </div>
    );
  }

  void (key as CategoryKey);
  return (
    <PlaceholderPage
      title={cat.label}
      message={`${cat.hint}：网页 Demo 暂未开放。`}
    />
  );
}

export function TaMomentPage() {
  useOpenSupplyMoments();
  const { providerId = '' } = useParams();
  const provider = getProvider(providerId);
  const list = listMomentsByProvider(providerId);

  if (!provider) {
    return (
      <div className="page">
        <PageHeader title="TA 的 Moment" backTo="/feed" />
        <p className="empty">用户不存在</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="TA 的 Moment" backTo="/feed" />
      <div className="detail-hero">
        <div className="avatar avatar--lg" style={{ background: provider.avatarColor }}>
          {provider.name.slice(0, 1)}
        </div>
        <div>
          <strong>{provider.name}</strong>
          {provider.verified && <span className="badge">已认证</span>}
          <p className="muted">{provider.bio}</p>
          <p className="pill">{list.length > 0 ? '开放中' : '暂无档期'}</p>
        </div>
      </div>
      <h3 className="section__title">当前开放</h3>
      <div className="stack">
        {list.length === 0 ? (
          <p className="empty">暂无开放的 Moment</p>
        ) : (
          list.map((m) => <MomentCard key={m.id} moment={m} />)
        )}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <PlaceholderPage title="页面不存在" message="链接无效，请从 Moment 首页重新进入。" />
  );
}
