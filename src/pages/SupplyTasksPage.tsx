import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { confirmGroupOrderSide } from '../state/groupOrderStore';
import { confirmBooking, statusLabel, timingLabel } from '../state/orderStore';
import { useSupplyTasks } from '../state/supplyTasks';
import { providerFulfillPath, providerWaitingPath } from '../utils/orderPerspective';

export function SupplyTasksPage() {
  const tasks = useSupplyTasks();

  return (
    <div className="page">
      <PageHeader title="待处理任务" backTo="/profile/my-moments" />

      {tasks.total === 0 ? (
        <div className="supply-empty supply-empty--compact">
          <h2>当前没有待处理任务</h2>
          <p className="muted">有新预约或待确认服务时，会集中出现在这里。</p>
          <Link to="/profile/my-moments" className="btn btn--ghost btn--block">
            返回我的 Moment
          </Link>
        </div>
      ) : (
        <>
          {tasks.pendingConfirm.length > 0 && (
            <section className="section">
              <h3 className="section__title">
                待确认预约 · {tasks.pendingConfirm.length}
              </h3>
              <p className="section__desc">
                远档预约需你确认后才会锁定买家时间。
              </p>
              <div className="stack">
                {tasks.pendingConfirm.map((order) => (
                  <article key={order.id} className="task-card task-card--urgent">
                    <div>
                      <strong>{order.title}</strong>
                      <p className="muted">
                        {order.slotLabel} · ¥{order.priceYuan.toFixed(1)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => confirmBooking(order.id)}
                    >
                      确认预约
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tasks.upcoming.length > 0 && (
            <section className="section">
              <h3 className="section__title">
                待履约 · {tasks.upcoming.length}
              </h3>
              <div className="stack">
                {tasks.upcoming.map((order) => (
                  <article key={order.id} className="task-card">
                    <div>
                      <strong>{order.title}</strong>
                      <p className="muted">
                        {timingLabel(order.timing)} · {order.slotLabel} ·{' '}
                        {statusLabel(order.status)}
                        {!order.providerReady ? ' · 待标记就绪' : ''}
                        {order.buyerReady ? ' · 买家已就位' : ''}
                      </p>
                    </div>
                    <div className="task-card__actions">
                      <Link
                        to={
                          order.status === 'in_progress'
                            ? providerFulfillPath(order)
                            : providerWaitingPath(order.id)
                        }
                        className="btn btn--primary btn--sm"
                      >
                        {order.status === 'in_progress' ? '继续履约' : '进入等待室'}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tasks.companionConfirm.length > 0 && (
            <section className="section">
              <h3 className="section__title">
                待确认交割 · {tasks.companionConfirm.length}
              </h3>
              <div className="stack">
                {tasks.companionConfirm.map((order) => (
                  <article key={order.id} className="task-card">
                    <div>
                      <strong>{order.title}</strong>
                      <p className="muted">
                        {order.whenLabel} · {order.placeLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => confirmGroupOrderSide(order.id, 'host')}
                    >
                      确认交割
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
