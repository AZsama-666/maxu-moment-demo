import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SupplyLaunchProgress } from '../../components/SupplyLaunchProgress';
import type { SkuType } from '../../data/mock';
import {
  updateLaunchDraft,
  useLaunchDraft,
} from '../../state/launchDraftStore';

const validTypes: SkuType[] = ['voice', 'video', 'companion', 'group'];

export function LaunchProductPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sku = params.get('sku') as SkuType | null;
  const draft = useLaunchDraft();
  const [error, setError] = useState('');

  if (!sku || !validTypes.includes(sku)) {
    return <Navigate to="/profile/my-moments/launch/type" replace />;
  }
  if (draft.skuType !== sku) {
    return <Navigate to="/profile/my-moments/launch/type" replace />;
  }

  const isCompanion = sku === 'companion';
  const isGroup = sku === 'group';

  return (
    <div className="page page--launch">
      <PageHeader title="商品与定价" backTo="/profile/my-moments/launch/type" />
      <SupplyLaunchProgress current={2} />

      <section className="section">
        <label className="form-field">
          <span>Moment 标题</span>
          <input
            value={draft.title}
            maxLength={30}
            onChange={(event) => updateLaunchDraft({ title: event.target.value })}
          />
        </label>
        <label className="form-field">
          <span>简短介绍</span>
          <textarea
            rows={3}
            value={draft.description}
            maxLength={120}
            onChange={(event) =>
              updateLaunchDraft({ description: event.target.value })
            }
          />
        </label>
        <label className="form-field">
          <span>单份价格（元）</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={draft.priceYuan}
            onChange={(event) =>
              updateLaunchDraft({ priceYuan: Number(event.target.value) || 0 })
            }
          />
        </label>

        {isGroup ? (
          <label className="form-field">
            <span>活动总席位</span>
            <input
              type="number"
              min={2}
              max={99}
              value={draft.seats}
              onChange={(event) =>
                updateLaunchDraft({ seats: Number(event.target.value) || 2 })
              }
            />
          </label>
        ) : isCompanion ? (
          <>
            <label className="form-field">
              <span>服务单位</span>
              <input
                value={draft.unitLabel}
                onChange={(event) =>
                  updateLaunchDraft({ unitLabel: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>最大席位</span>
              <input
                type="number"
                min={1}
                max={99}
                value={draft.seats}
                onChange={(event) =>
                  updateLaunchDraft({ seats: Number(event.target.value) || 1 })
                }
              />
            </label>
          </>
        ) : (
          <>
            <label className="form-field">
              <span>单份时长（秒）</span>
              <input
                type="number"
                min={15}
                max={600}
                value={draft.durationSec}
                onChange={(event) =>
                  updateLaunchDraft({
                    durationSec: Number(event.target.value) || 60,
                  })
                }
              />
            </label>
            <div className="info-callout">
              买家可购买多份，实际履约时长按份数累加。
            </div>
          </>
        )}
      </section>

      {error && <p className="error">{error}</p>}
      <div className="launch-bottom">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            if (!draft.title.trim()) {
              setError('请填写 Moment 标题');
              return;
            }
            if (!draft.description.trim()) {
              setError('请填写简短介绍');
              return;
            }
            if (draft.priceYuan <= 0) {
              setError('单份价格需大于 0');
              return;
            }
            navigate(`/profile/my-moments/launch/fulfillment?sku=${sku}`);
          }}
        >
          下一步：设置如何接单
        </button>
      </div>
    </div>
  );
}
