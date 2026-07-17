import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import type { InteractionForm } from '../data/mock';
import { createSupplyMoment, getOpenListingByForm } from '../state/supplyStore';

export function CreateMomentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = (params.get('form') as InteractionForm) || 'voice';

  const [form, setForm] = useState<InteractionForm>(preset);
  const existing = getOpenListingByForm(form);

  const [title, setTitle] = useState(
    existing?.title ?? (form === 'voice' ? '60 秒语音专属时刻' : '60 秒视频专属时刻'),
  );
  const [durationSec, setDurationSec] = useState(existing?.durationSec ?? 60);
  const [priceYuan, setPriceYuan] = useState(existing?.priceYuan ?? (form === 'voice' ? 9.9 : 19.9));
  const [slot1, setSlot1] = useState(existing?.slots[0]?.label ?? '今天 20:00');
  const [slot2, setSlot2] = useState(existing?.slots[1]?.label ?? '明天 19:30');
  const [quota, setQuota] = useState(existing?.slots[0]?.remaining ?? 5);
  const [asapEnabled, setAsapEnabled] = useState(existing?.asapEnabled ?? true);
  const [error, setError] = useState('');

  const applyFormDefaults = (next: InteractionForm) => {
    setForm(next);
    const cur = getOpenListingByForm(next);
    if (cur) {
      setTitle(cur.title);
      setDurationSec(cur.durationSec);
      setPriceYuan(cur.priceYuan);
      setSlot1(cur.slots[0]?.label ?? '');
      setSlot2(cur.slots[1]?.label ?? '');
      setQuota(cur.slots[0]?.remaining ?? 5);
      setAsapEnabled(cur.asapEnabled);
    } else if (next === 'voice') {
      setTitle('60 秒语音专属时刻');
      setPriceYuan(9.9);
      setSlot1('今天 20:00');
      setSlot2('明天 19:30');
    } else {
      setTitle('60 秒视频专属时刻');
      setPriceYuan(19.9);
      setSlot1('今天 20:30');
      setSlot2('明天 20:00');
    }
  };

  const isUpdate = useMemo(() => Boolean(getOpenListingByForm(form)), [form, title]);

  return (
    <div className="page">
      <PageHeader title={isUpdate ? '更新 Moment' : '开放 Moment'} backTo="/profile/my-moments" />
      <p className="section__desc">
        语音 / 视频请分条维护。同形态仅保留一条长期 SKU；再次提交将更新已有配置。
      </p>

      {isUpdate && (
        <div className="soft-card soft-card--static" style={{ marginBottom: 12 }}>
          <p>
            已有开放的{form === 'voice' ? '语音' : '视频'} SKU，保存后将<strong>更新</strong>
            而非新建。
          </p>
        </div>
      )}

      <section className="section">
        <h3 className="section__title">互动形式</h3>
        <div className="pay-methods">
          <button
            type="button"
            className={`slot-item ${form === 'voice' ? 'slot-item--active' : ''}`}
            onClick={() => applyFormDefaults('voice')}
          >
            语音互动
          </button>
          <button
            type="button"
            className={`slot-item ${form === 'video' ? 'slot-item--active' : ''}`}
            onClick={() => applyFormDefaults('video')}
          >
            视频互动
          </button>
        </div>
      </section>

      <section className="section">
        <h3 className="section__title">基本信息</h3>
        <label className="form-field">
          <span>标题</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="form-field">
          <span>时长（秒）</span>
          <input
            type="number"
            min={15}
            max={600}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value) || 60)}
          />
        </label>
        <label className="form-field">
          <span>价格（元）</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={priceYuan}
            onChange={(e) => setPriceYuan(Number(e.target.value) || 0)}
          />
        </label>
      </section>

      <section className="section">
        <h3 className="section__title">供给能力</h3>
        <label className="toggle-row">
          <span>尽快接单（ASAP）</span>
          <input
            type="checkbox"
            checked={asapEnabled}
            onChange={(e) => setAsapEnabled(e.target.checked)}
          />
        </label>
        <p className="muted">
          开启后购买方可下「尽快」单。临时不接请在「我的 Moment」用「暂停接单」，无需关掉能力。
        </p>
      </section>

      <section className="section">
        <h3 className="section__title">预开放档期（预约）</h3>
        <label className="form-field">
          <span>档期 1（可留空 = 仅 ASAP）</span>
          <input value={slot1} onChange={(e) => setSlot1(e.target.value)} />
        </label>
        <label className="form-field">
          <span>档期 2（可留空）</span>
          <input value={slot2} onChange={(e) => setSlot2(e.target.value)} />
        </label>
        <label className="form-field">
          <span>每个档期名额</span>
          <input
            type="number"
            min={1}
            max={99}
            value={quota}
            onChange={(e) => setQuota(Number(e.target.value) || 1)}
          />
        </label>
      </section>

      {error && <p className="error">{error}</p>}

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => {
          if (!title.trim()) {
            setError('请填写标题');
            return;
          }
          if (!asapEnabled && !slot1.trim()) {
            setError('请至少开启尽快接单，或填写一个预约档期');
            return;
          }
          if (priceYuan <= 0 || durationSec <= 0) {
            setError('价格、时长需大于 0');
            return;
          }
          const slots: { label: string; remaining: number }[] = [];
          if (slot1.trim()) slots.push({ label: slot1.trim(), remaining: quota });
          if (slot2.trim()) slots.push({ label: slot2.trim(), remaining: quota });
          createSupplyMoment({
            form,
            title: title.trim(),
            durationSec,
            priceYuan,
            slots,
            asapEnabled,
          });
          navigate('/profile/my-moments');
        }}
      >
        {isUpdate ? '保存更新' : '开放长期供给'}
      </button>
      <Link to="/profile/my-moments" className="btn btn--ghost btn--block">
        返回履约台
      </Link>
      <p className="footer-note">本 Demo 模拟挂单，无真实审核与结算。</p>
    </div>
  );
}
