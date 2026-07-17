import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SupplyLaunchProgress } from '../../components/SupplyLaunchProgress';
import type { SkuType } from '../../data/mock';
import {
  updateLaunchDraft,
  useLaunchDraft,
  type DraftSlot,
} from '../../state/launchDraftStore';

const validTypes: SkuType[] = ['voice', 'video', 'companion'];

export function LaunchFulfillmentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sku = params.get('sku') as SkuType | null;
  const draft = useLaunchDraft();
  const [error, setError] = useState('');

  if (!sku || !validTypes.includes(sku) || draft.skuType !== sku) {
    return <Navigate to="/profile/my-moments/launch/type" replace />;
  }

  const updateSlot = (index: number, patch: Partial<DraftSlot>) => {
    updateLaunchDraft({
      slots: draft.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    });
  };

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
            陪玩不使用实时接单。服务完成后，由买家和你双方确认交割。
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
            <p className="muted">服务结束后，买家确认收货、你确认交割，双方都确认后订单完成。</p>
          </div>
        </section>
      ) : (
        <>
          <section className="section">
            <h3 className="section__title">实时接单</h3>
            <label className="toggle-row">
              <span>
                <strong>允许买家发起尽快单</strong>
                <small>收到订单后需在 2 分钟内接单</small>
              </span>
              <input
                type="checkbox"
                checked={draft.realtimeEnabled}
                onChange={(event) =>
                  updateLaunchDraft({ realtimeEnabled: event.target.checked })
                }
              />
            </label>
            <p className="muted">
              超时未接，系统会自动向买家退款。发布后可以随时暂停或恢复实时接单。
            </p>
          </section>

          <section className="section">
            <div className="section__head">
              <div>
                <h3 className="section__title">预约档期</h3>
                <p className="section__desc">可选；最多添加 3 个档期</p>
              </div>
              {draft.slots.length < 3 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() =>
                    updateLaunchDraft({
                      slots: [
                        ...draft.slots,
                        {
                          label:
                            draft.slots.length === 0
                              ? '今天 20:00'
                              : `明天 ${19 + draft.slots.length}:00`,
                          remaining: 5,
                        },
                      ],
                    })
                  }
                >
                  + 添加档期
                </button>
              )}
            </div>

            <div className="launch-slot-editor">
              {draft.slots.map((slot, index) => (
                <div key={index} className="launch-slot-row">
                  <input
                    aria-label={`档期 ${index + 1}`}
                    value={slot.label}
                    onChange={(event) =>
                      updateSlot(index, { label: event.target.value })
                    }
                  />
                  <input
                    aria-label={`档期 ${index + 1} 可售份数`}
                    type="number"
                    min={1}
                    max={99}
                    value={slot.remaining}
                    onChange={(event) =>
                      updateSlot(index, {
                        remaining: Number(event.target.value) || 1,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      updateLaunchDraft({
                        slots: draft.slots.filter(
                          (_, slotIndex) => slotIndex !== index,
                        ),
                      })
                    }
                  >
                    删除
                  </button>
                </div>
              ))}
              {draft.slots.length === 0 && (
                <p className="empty-inline">暂未设置预约档期</p>
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
            } else if (!draft.realtimeEnabled && draft.slots.length === 0) {
              setError('请至少开启实时接单，或添加一个预约档期');
              return;
            }
            if (draft.slots.some((slot) => !slot.label.trim())) {
              setError('请填写完整的档期时间');
              return;
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
