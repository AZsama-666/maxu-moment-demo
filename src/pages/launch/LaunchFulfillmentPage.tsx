import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SupplyLaunchProgress } from '../../components/SupplyLaunchProgress';
import type { SkuType } from '../../data/mock';
import {
  draftScheduleConfig,
  updateLaunchDraft,
  useLaunchDraft,
  validateScheduleDraft,
} from '../../state/launchDraftStore';
import {
  listAllBookableSlots,
  scheduleFromDraft,
} from '../../utils/bookingSlots';

const validTypes: SkuType[] = ['voice', 'video', 'companion'];
const intervalOptions = [15, 30, 60];

export function LaunchFulfillmentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sku = params.get('sku') as SkuType | null;
  const draft = useLaunchDraft();
  const [error, setError] = useState('');

  const previewSlots = useMemo(() => {
    if (sku === 'companion' || validateScheduleDraft(draft)) return [];
    const config = scheduleFromDraft(draftScheduleConfig(draft));
    return listAllBookableSlots('preview', config).slice(0, 3);
  }, [draft, sku]);

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

      {sku === 'companion' ? (
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
            <h3 className="section__title">排期规则</h3>
            <p className="section__desc">
              系统按 T+N 与间隔 X 自动生成可预约时间，买家在详情页横向选择。
            </p>
            <label className="form-field">
              <span>最早可约缓冲 N（分钟，必填）</span>
              <input
                type="number"
                min={5}
                max={240}
                step={5}
                placeholder="例如 15"
                value={draft.bufferMin}
                onChange={(event) =>
                  updateLaunchDraft({
                    bufferMin:
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                  })
                }
              />
              <small className="muted">从现在起至少 N 分钟后可被预约</small>
            </label>
            <label className="form-field">
              <span>预约间隔 X（分钟，必填）</span>
              <div className="segment-row">
                {intervalOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`segment-btn ${
                      draft.slotIntervalMin === value ? 'segment-btn--active' : ''
                    }`}
                    onClick={() => updateLaunchDraft({ slotIntervalMin: value })}
                  >
                    {value} 分
                  </button>
                ))}
              </div>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>每日开始</span>
                <input
                  type="time"
                  value={draft.availFrom}
                  onChange={(event) =>
                    updateLaunchDraft({ availFrom: event.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>每日结束</span>
                <input
                  type="time"
                  value={draft.availTo}
                  onChange={(event) =>
                    updateLaunchDraft({ availTo: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="form-field">
              <span>可预约天数（必填）</span>
              <input
                type="number"
                min={1}
                max={30}
                placeholder="例如 7"
                value={draft.bookableDays}
                onChange={(event) =>
                  updateLaunchDraft({
                    bookableDays:
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                  })
                }
              />
            </label>
          </section>

          {previewSlots.length > 0 && (
            <section className="section">
              <h3 className="section__title">预览</h3>
              <p className="section__desc">买家最早会看到以下时段（示例）：</p>
              <div className="book-time-row book-time-row--preview">
                {previewSlots.map((slot) => (
                  <div key={slot.id} className="book-time-chip">
                    <strong>{slot.label}</strong>
                    <span className="muted">空闲</span>
                  </div>
                ))}
              </div>
            </section>
          )}
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
