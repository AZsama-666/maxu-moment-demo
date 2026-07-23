import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GroupActivityFeed } from '../components/GroupActivityFeed';
import { GroupCard, PersonCard } from '../components/MarketCards';
import { listHomeFeed } from '../data/marketMock';
import { marketFilters, type CategoryKey } from '../data/mock';
import { useOpenSupplyMoments } from '../state/supplyStore';

export function HomePage() {
  useOpenSupplyMoments();
  const [category, setCategory] = useState<'all' | CategoryKey>('all');
  const [within15Min, setWithin15Min] = useState(false);
  const isGroupTab = category === 'group';

  const feed = isGroupTab ? [] : listHomeFeed(category, within15Min);

  return (
    <div className="page page--home">
      <div className="home-top">
        <div className="search-bar" role="search">
          <span className="search-bar__icon">⌕</span>
          <span className="search-bar__placeholder">搜索想约的人或专属时刻</span>
        </div>
        <Link to="/profile/orders" className="home-orders-link">
          我的订单
        </Link>
      </div>

      <div className="cat-row">
        {marketFilters.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`cat-chip ${category === c.key ? 'cat-chip--active' : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!isGroupTab && (
        <div className="filter-row">
          <button
            type="button"
            className={`filter-chip ${within15Min ? 'filter-chip--active' : ''}`}
            onClick={() => setWithin15Min((v) => !v)}
          >
            15分钟内可约
          </button>
        </div>
      )}

      {isGroupTab ? (
        <GroupActivityFeed />
      ) : feed.length === 0 ? (
        <p className="empty">
          {within15Min
            ? '暂时没有 15 分钟内可约的供给，关掉筛选看看其他卡片吧'
            : '该分类暂无供给'}
        </p>
      ) : (
        <div className="stack stack--feed">
          {feed.map((item) =>
            item.kind === 'group' ? (
              <GroupCard key={item.group.id} listing={item.group} />
            ) : (
              <PersonCard key={item.person.providerId} person={item.person} />
            ),
          )}
        </div>
      )}

      <div className="supply-launch-card">
        <div>
          <strong>发起自己的 Moment</strong>
          <p>开放语音、视频、组局或陪玩，让别人来约你</p>
        </div>
        <Link
          to="/profile/my-moments/launch/type"
          className="btn btn--primary btn--sm"
        >
          去发起
        </Link>
      </div>
    </div>
  );
}
