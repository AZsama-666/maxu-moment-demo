import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { feedPosts, type FeedPost } from '../data/appShellMock';
import { SELF_PROVIDER_ID } from '../data/mock';
import { hasOpenSupplyMoments, useSupplyListings } from '../state/supplyStore';

const feedTabs = ['视频', '发现', '关注'] as const;
type FeedTab = (typeof feedTabs)[number];

export function FeedPage() {
  const [tab, setTab] = useState<FeedTab>('发现');
  const listings = useSupplyListings();
  const selfOpen = hasOpenSupplyMoments();

  const posts = useMemo(() => {
    void listings;
    const base = feedPosts.map((p) => {
      if (p.providerId === SELF_PROVIDER_ID && selfOpen) {
        return { ...p, momentSignal: p.momentSignal ?? '开放中' };
      }
      return p;
    });
    return base;
  }, [listings, selfOpen]);

  return (
    <div className="feed-page">
      <header className="feed-header">
        <div className="feed-tabs">
          {feedTabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`feed-tab ${tab === t ? 'feed-tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
              {tab === t && <span className="feed-tab__indicator" />}
            </button>
          ))}
        </div>
        <span className="feed-search" aria-label="搜索">
          ⌕
        </span>
      </header>

      {tab === '发现' && (
        <>
          {selfOpen && (
            <Link to={`/ta/${SELF_PROVIDER_ID}`} className="feed-banner-signal">
              <span className="moment-signal-pill">开放中</span>
              <span>你已开放 Moment · 查看 TA 的 Moment（演示自己）</span>
            </Link>
          )}
          <div className="masonry">
            <div className="masonry__col">
              {posts
                .filter((_, i) => i % 2 === 0)
                .map((post) => (
                  <FeedCard key={post.id} post={post} />
                ))}
            </div>
            <div className="masonry__col">
              {posts
                .filter((_, i) => i % 2 === 1)
                .map((post) => (
                  <FeedCard key={post.id} post={post} />
                ))}
            </div>
          </div>
        </>
      )}

      {tab === '视频' && (
        <div className="feed-empty">
          <p>视频流（Demo 已 mock）</p>
          <p className="muted">正式版为全屏竖滑视频</p>
        </div>
      )}

      {tab === '关注' && (
        <div className="feed-empty">
          <p>关注的人还没有新动态</p>
          <p className="muted">去发现页看看吧</p>
        </div>
      )}
    </div>
  );
}

function FeedCard({ post }: { post: FeedPost }) {
  const clickable = Boolean(post.momentSignal && post.providerId);

  const inner = (
    <>
      <div
        className="feed-card__cover"
        style={{ background: post.coverGradient, height: post.coverHeight }}
      >
        {post.momentSignal && (
          <span className="moment-signal">{post.momentSignal}</span>
        )}
      </div>
      <div className="feed-card__title">{post.title}</div>
      <div className="feed-card__foot">
        <span
          className="feed-card__avatar"
          style={{ background: post.authorColor }}
        >
          {post.authorName.slice(0, 1)}
        </span>
        <span className="feed-card__name">{post.authorName}</span>
        {post.momentSignal && (
          <span className="moment-signal-pill moment-signal-pill--inline">
            {post.momentSignal}
          </span>
        )}
        <span className="feed-card__like">♡ {post.likeCount}</span>
      </div>
    </>
  );

  if (clickable && post.providerId) {
    return (
      <Link to={`/ta/${post.providerId}`} className="feed-card">
        {inner}
      </Link>
    );
  }
  return <div className="feed-card">{inner}</div>;
}
