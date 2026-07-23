import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SupplyLaunchProgress } from '../../components/SupplyLaunchProgress';
import { formatRefundPolicySummary } from '../../data/marketMock';
import type { SkuType } from '../../data/mock';
import {
  draftScheduleConfig,
  updateLaunchDraft,
  useLaunchDraft,
  validateScheduleDraft,
} from '../../state/launchDraftStore';
import { useSupplyTasks } from '../../state/supplyTasks';
import {
  formatBusinessHoursLabel,
  formatNextOpenLabel,
  getBookingStatus,
  listAllBookableSlots,
  MIN_LEAD_MIN,
  scheduleFromDraft,
  SLOT_INTERVAL_MIN,
} from '../../utils/bookingSlots';

const validTypes: SkuType[] = ['voice', 'video', 'companion', 'group'];

export function LaunchFulfillmentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sku = params.get('sku') as SkuType | null;
  const draft = useLaunchDraft();
  const tasks = useSupplyTasks();
  const [error, setError] = useState('');
  const [previewNow, setPreviewNow] = useState(() => Date.now());

  useEffect(() => {
    if (sku === 'companion' || sku === 'group') return;
    const timer = window.setInterval(() => setPreviewNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [sku]);

  const schedulePreview = useMemo(() => {
    if (sku === 'companion' || sku === 'group' || validateScheduleDraft(draft)) return null;
    const config = scheduleFromDraft(draftScheduleConfig(draft));
    const now = new Date(previewNow);
    const status = getBookingStatus('preview', config, now);
    const slots = listAllBookableSlots('preview', config, now).slice(0, 3);
    return { config, status, slots, now };
  }, [draft, sku, previewNow]);

  if (!sku || !validTypes.includes(sku) || draft.skuType !== sku) {
    return <Navigate to="/profile/my-moments/launch/type" replace />;
  }

  return (
    <div className="page page--launch">
      <PageHeader
        title="履约设置"
        backTo={`/profile/my-moments/launch/product?sku=${sku}`}
      />
      <SupplyLaunchProgress current={3} />

      {sku === 'group' ? (
        <section className="section">
          <div className="info-callout">
            Demo 已预填狼人杀活动模板。到场后由买卖双方确认交割；主理人微信仅付款后展示。
          </div>
          <label className="form-field">
            <span>活动时间</span>
            <input
              value={draft.serviceTime}
              onChange={(event) =>
                updateLaunchDraft({ serviceTime: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>活动地点</span>
            <input
              value={draft.placeLabel}
              onChange={(event) =>
                updateLaunchDraft({ placeLabel: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>活动简介</span>
            <textarea
              rows={3}
              value={draft.intro}
              onChange={(event) => updateLaunchDraft({ intro: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>主理人简介</span>
            <textarea
              rows={2}
              value={draft.hostIntro}
              onChange={(event) =>
                updateLaunchDraft({ hostIntro: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>主理人微信（付款后买家可见）</span>
            <input
              value={draft.hostWechatId}
              onChange={(event) =>
                updateLaunchDraft({ hostWechatId: event.target.value })
              }
            />
          </label>
          <div className="soft-card soft-card--static">
            <strong>退改规则</strong>
            <p className="muted">
              {formatRefundPolicySummary(draft.refundPolicy)}
            </p>
          </div>
          {draft.contentSections.map((section) => (
            <div key={section.title} className="soft-card soft-card--static">
              <strong>{section.title}</strong>
              <p className="muted" style={{ whiteSpace: 'pre-line' }}>
                {section.body}
              </p>
            </div>
          ))}
        </section>
      ) : sku === 'companion' ? (
        <section className="section">
          <div className="info-callout">
            陪玩不使用预约排期。服务完成后，由买家和你双方确认交割。
          </div>
          <label className="form-field">
            <span>服务时间</span>
            <input
              value={draft.serviceTime}
              onChange={(event) =>
                updateLaunchDraft({ serviceTime: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>服务地点或线上方式</span>
            <input
              value={draft.placeLabel}
              onChange={(event) =>
                updateLaunchDraft({ placeLabel: event.target.value })
              }
            />
          </label>
          <div className="soft-card soft-card--static">
            <strong>交割方式</strong>
            <p className="muted">
              服务结束后，买家确认收货、你确认交割，双方都确认后订单完成。
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="section">
            <h3 className="section__title">开放可约</h3>
            <label className="toggle-row">
              <span>
                <strong>在市集展示并允许预约</strong>
                <small>关闭后买家看不到可约时间</small>
              </span>
              <input
                type="checkbox"
                checked={draft.bookingOpen}
                onChange={(event) =>
                  updateLaunchDraft({ bookingOpen: event.target.checked })
                }
              />
            </label>
          </section>

          <section className="section">
            <h3 className="section__title">营业时间</h3>
            <p className="section__desc">
              系统按 {SLOT_INTERVAL_MIN} 分钟格子自动生成可预约时间；买家需至少提前{' '}
              {MIN_LEAD_MIN} 分钟下单。结束早于开始表示跨日至次日，如 10:00–02:00。
            </p>
            <div className="form-row">
              <label className="form-field">
                <span>开始</span>
                <input
                  type="time"
                  value={draft.availFrom}
                  onChange={(event) =>
                    updateLaunchDraft({ availFrom: event.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>结束</span>
                <input
                  type="time"
                  value={draft.availTo}
                  onChange={(event) =>
                    updateLaunchDraft({ availTo: event.target.value })
                  }
                />
              </label>
            </div>
          </section>

          {schedulePreview && (
            <section className="section">
              <h3 className="section__title">预览</h3>
              <p className="section__desc">
                营业时间 {formatBusinessHoursLabel(schedulePreview.config)} ·{' '}
                {schedulePreview.status.inBusiness
                  ? schedulePreview.status.earliestSlot
                    ? '营业中 · 买家最早可约时段如下'
                    : '营业中 · 已约满'
                  : schedulePreview.status.nextOpenAt
                    ? `打烊 · ${formatNextOpenLabel(
                        schedulePreview.status.nextOpenAt,
                        schedulePreview.now,
                      )} 起可约`
                    : '暂停可约'}
              </p>
              {schedulePreview.slots.length > 0 && (
                <div className="book-time-row book-time-row--preview">
                  {schedulePreview.slots.map((slot) => (
                    <div key={slot.id} className="book-time-chip">
                      <strong>{slot.label}</strong>
                      <span className="muted">空闲</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="section">
            <h3 className="section__title">作为供给方如何履约</h3>
            <div className="soft-card soft-card--static">
              <ol className="rules" style={{ margin: 0, paddingLeft: 18 }}>
                <li>有新预约时，消息页和待处理任务会提醒你。</li>
                <li>到点前进入供给等待室，标记就绪；买家就位后可提前开始。</li>
                <li>双方就绪后进入供给专属语音/视频页完成服务。</li>
              </ol>
              {tasks.total > 0 && (
                <Link
                  to="/profile/my-moments/tasks"
                  className="btn btn--ghost btn--sm"
                  style={{ marginTop: 12 }}
                >
                  查看 {tasks.total} 项待处理任务
                </Link>
              )}
            </div>
          </section>
        </>
      )}

      {error && <p className="error">{error}</p>}
      <div className="launch-bottom">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            if (sku === 'companion') {
              if (!draft.serviceTime.trim() || !draft.placeLabel.trim()) {
                setError('请填写服务时间和服务方式');
                return;
              }
            } else if (sku === 'group') {
              if (
                !draft.serviceTime.trim() ||
                !draft.placeLabel.trim() ||
                !draft.intro.trim()
              ) {
                setError('请填写活动时间、地点和活动简介');
                return;
              }
            } else {
              const scheduleError = validateScheduleDraft(draft);
              if (scheduleError) {
                setError(scheduleError);
                return;
              }
            }
            navigate('/profile/my-moments/launch/preview');
          }}
        >
          下一步：确认买家看到的内容
        </button>
      </div>
    </div>
  );
}
