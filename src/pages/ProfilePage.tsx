import { useState } from 'react';
import { Link } from 'react-router-dom';
import { myPosts, myProfile } from '../data/appShellMock';
import { useOrders } from '../state/orderStore';
import { resetDemoData } from '../state/resetDemoData';
import { useSupplyTasks } from '../state/supplyTasks';

const mainTabs = ['动态', '产品'] as const;
type MainTab = (typeof mainTabs)[number];

export function ProfilePage() {
  const [tab, setTab] = useState<MainTab>('动态');
  const orders = useOrders();
  const supplyTasks = useSupplyTasks();

  return (
    <div className="profile-page">
      <div className="profile-banner">
        <div className="profile-banner__top">
          <span>邀请码</span>
          <span>···</span>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-card__head">
          <span className="avatar avatar--lg" style={{ background: myProfile.avatarColor }}>
            {myProfile.name.slice(0, 1)}
          </span>
          <div className="profile-card__id">
            <div className="profile-card__name">
              {myProfile.name}
              <span className="profile-title-chip">{myProfile.title}</span>
            </div>
            <p className="muted">
              玛薯号：{myProfile.maxuId} · {myProfile.ipLocation}
            </p>
          </div>
        </div>

        <p className="profile-bio">{myProfile.bio}</p>

        <div className="profile-stats">
          <span>
            <strong>{myProfile.following}</strong> 关注
          </span>
          <span>
            <strong>{myProfile.followers}</strong> 粉丝
          </span>
          <span>
            <strong>{myProfile.likes}</strong> 获赞
          </span>
        </div>

        <div className="profile-actions">
          <button type="button" className="profile-action">
            编辑资料
          </button>
          <button type="button" className="profile-action">
            薯袋
          </button>
          <Link to="/profile/orders" className="profile-action profile-action--primary">
            订单{orders.length > 0 ? ` · ${orders.length}` : ''}
          </Link>
        </div>
        <div className="profile-actions profile-actions--second">
          <Link
            to="/profile/my-moments"
            className="profile-action profile-action--moment"
          >
            <span>我的 Moment</span>
            <small>供给 SKU 与待处理任务</small>
            {supplyTasks.total > 0 && (
              <span className="action-badge">{supplyTasks.total}</span>
            )}
          </Link>
        </div>
      </div>

      <div className="profile-tabs">
        {mainTabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`profile-tab ${tab === t ? 'profile-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {tab === t && <span className="profile-tab__indicator" />}
          </button>
        ))}
      </div>

      {tab === '动态' && (
        <div className="masonry masonry--pad">
          <div className="masonry__col">
            {myPosts
              .filter((_, i) => i % 2 === 0)
              .map((post) => (
                <div key={post.id} className="feed-card">
                  <div
                    className="feed-card__cover"
                    style={{ background: post.coverGradient, height: post.coverHeight }}
                  />
                  <div className="feed-card__title">{post.title}</div>
                  <div className="feed-card__foot">
                    <span className="feed-card__like">♡ {post.likeCount}</span>
                  </div>
                </div>
              ))}
          </div>
          <div className="masonry__col">
            {myPosts
              .filter((_, i) => i % 2 === 1)
              .map((post) => (
                <div key={post.id} className="feed-card">
                  <div
                    className="feed-card__cover"
                    style={{ background: post.coverGradient, height: post.coverHeight }}
                  />
                  <div className="feed-card__title">{post.title}</div>
                  <div className="feed-card__foot">
                    <span className="feed-card__like">♡ {post.likeCount}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab === '产品' && (
        <div className="feed-empty">
          <p>我拥有的 / 我创作的（Demo 已 mock）</p>
          <p className="muted">
            Moment 订单请从上方「订单」查看
          </p>
        </div>
      )}

      <section className="section danger-zone profile-reset">
        <p className="muted">清空本机订单、自建 Moment 与草稿，回到初始演示状态。</p>
        <button
          type="button"
          className="btn btn--danger btn--block"
          onClick={() => {
            if (window.confirm('确认重置本机 Demo 数据？此操作不可撤销。')) {
              resetDemoData();
            }
          }}
        >
          重置 Demo 数据
        </button>
      </section>
    </div>
  );
}
