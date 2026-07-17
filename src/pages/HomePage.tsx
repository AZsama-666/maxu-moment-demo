import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GroupCard, TransferCard } from '../components/MarketCards';
import { MomentCard } from '../components/MomentCard';
import {
  filterMarketItems,
  listMarketItems,
  sortMarketItems,
} from '../data/marketMock';
import { marketFilters, type CategoryKey } from '../data/mock';
import { useOpenSupplyMoments } from '../state/supplyStore';

export function HomePage() {
  useOpenSupplyMoments();
  const [category, setCategory] = useState<'all' | CategoryKey>('all');
  const [onlyNow, setOnlyNow] = useState(false);

  const visible = sortMarketItems(
    filterMarketItems(listMarketItems(), category, onlyNow),
  );

  return (
    <div className="page">
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

      <div className="filter-row">
        <button
          type="button"
          className={`filter-chip ${onlyNow ? 'filter-chip--active' : ''}`}
          onClick={() => setOnlyNow((v) => !v)}
        >
          只看可尽快
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="empty">
          {onlyNow
            ? '暂时没有可尽快的供给，关掉筛选看看其他卡片吧'
            : '该分类暂无供给'}
        </p>
      ) : (
        <div className="stack">
          {visible.map((item) => {
            if (item.kind === '1v1') {
              return <MomentCard key={item.moment.id} moment={item.moment} />;
            }
            if (item.kind === 'group') {
              return <GroupCard key={item.id} listing={item} />;
            }
            return <TransferCard key={item.id} listing={item} />;
          })}
        </div>
      )}

      <div className="supply-launch-card">
        <div>
          <strong>发起自己的 Moment</strong>
          <p>开放语音、视频或陪玩，让别人来约你</p>
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
