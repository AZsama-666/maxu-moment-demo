import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getMoment, getProvider } from '../data/catalog';
import { ASAP_SLOT_ID, buyerAvailability } from '../data/mock';
import {
  createPendingOrder,
  getRemaining,
  MAX_ORDER_QTY,
  type FulfillTiming,
  type PayMethod,
} from '../state/orderStore';
import { useSupplyTick } from '../state/supplyStore';

export function CheckoutPage() {
  useSupplyTick();
  const { momentId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const moment = getMoment(momentId);
  const [error, setError] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [slotId, setSlotId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const avail = moment ? buyerAvailability(moment) : { kind: 'full' as const };
  const canAsap = avail.kind === 'now';
  const hasSlots = Boolean(
    moment?.slots.some((s) => getRemaining(moment.id, s.id) > 0),
  );

  const presetTiming = params.get('timing');
  const defaultTiming: FulfillTiming =
    presetTiming === 'scheduled'
      ? 'scheduled'
      : canAsap
        ? 'asap'
        : 'scheduled';
  const [timing, setTiming] = useState<FulfillTiming>(defaultTiming);

  const remaining = useMemo(() => {
    if (!moment || !slotId) return 0;
    return getRemaining(moment.id, slotId);
  }, [moment, slotId]);

  const maxQty = useMemo(() => {
    if (timing === 'asap') return MAX_ORDER_QTY;
    if (slotId && remaining > 0) return Math.min(MAX_ORDER_QTY, remaining);
    return MAX_ORDER_QTY;
  }, [timing, slotId, remaining]);

  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQty));
  }, [maxQty]);

  if (!moment) {
    return (
      <div className="page">
        <PageHeader title="确认下单" backTo="/" />
        <p className="empty">未找到该 Moment</p>
      </div>
    );
  }

  const provider = getProvider(moment.providerId);
  if (!provider) {
    return (
      <div className="page">
        <PageHeader title="确认下单" backTo="/" />
        <p className="empty">供给方不存在</p>
      </div>
    );
  }

  if (!canAsap && !hasSlots) {
    return (
      <div className="page">
        <PageHeader title="确认下单" backTo={`/moment/${moment.id}`} />
        <p className="empty">已约满，晚点再来看看</p>
      </div>
    );
  }

  const scheduledReady = timing === 'scheduled' ? Boolean(slotId) && remaining > 0 : true;
  const totalPrice = Number((moment.priceYuan * quantity).toFixed(1));
  const totalDuration = moment.durationSec * quantity;

  return (
    <div className="page page--checkout">
      <PageHeader title="确认下单" backTo={`/moment/${moment.id}`} />

      <div className="soft-card soft-card--static checkout-product">
        <div className="checkout-product__info">
          <strong>{moment.title}</strong>
          <p className="muted">
            {provider.name} · {moment.sceneTag} · {moment.durationSec} 秒/份
          </p>
          {quantity > 1 && (
            <p className="muted">合计 {totalDuration} 秒 · ¥{totalPrice.toFixed(1)}</p>
          )}
        </div>
        <div className="qty-stepper" aria-label="购买份数">
          <button
            type="button"
            className="qty-stepper__btn"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="qty-stepper__value">{quantity}</span>
          <button
            type="button"
            className="qty-stepper__btn"
            disabled={quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      {canAsap && timing === 'asap' && (
        <div className="rules-bar">尽快单付款后 2 分钟未接单，自动全额退款</div>
      )}

      <section className="section">
        <h3 className="section__title">履约时间</h3>
        <div className="timing-cards">
          {canAsap && avail.kind === 'now' && (
            <button
              type="button"
              className={`timing-card ${timing === 'asap' ? 'timing-card--active' : ''}`}
              onClick={() => setTiming('asap')}
            >
              <span className="timing-card__name">尽快</span>
              <span className="timing-card__time">
                {moment.avgResponseMin > 0
                  ? `平均响应时长 ${avail.waitMin} 分钟内开始`
                  : '新发布 · 付款后等待 TA 接单'}
              </span>
              <span className="timing-card__note">超时未接自动退</span>
            </button>
          )}
          {hasSlots && (
            <button
              type="button"
              className={`timing-card ${timing === 'scheduled' ? 'timing-card--active' : ''}`}
              onClick={() => setTiming('scheduled')}
            >
              <span className="timing-card__name">预约</span>
              <span className="timing-card__time">
                {timing === 'scheduled' && slotId
                  ? moment.slots.find((s) => s.id === slotId)?.label
                  : '选择时间'}
              </span>
              <span className="timing-card__note">到点履约</span>
            </button>
          )}
        </div>

        {timing === 'scheduled' && hasSlots && (
          <div className="slot-list" style={{ marginTop: 10 }}>
            {moment.slots.map((slot) => {
              const left = getRemaining(moment.id, slot.id);
              const disabled = left <= 0;
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={`slot-item ${slotId === slot.id ? 'slot-item--active' : ''}`}
                  disabled={disabled}
                  onClick={() => setSlotId(slot.id)}
                >
                  <span>{slot.label}</span>
                  <span className="muted">{disabled ? '已约满' : `剩 ${left}`}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="section section--pay">
        <h3 className="section__title">支付方式</h3>
        <div className="pay-methods">
          <button
            type="button"
            className={`slot-item ${payMethod === 'cash' ? 'slot-item--active' : ''}`}
            onClick={() => setPayMethod('cash')}
          >
            现金支付
          </button>
          <button
            type="button"
            className={`slot-item ${payMethod === 'coin' ? 'slot-item--active' : ''}`}
            onClick={() => setPayMethod('coin')}
          >
            平台币支付
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <div className="bottom-cta">
        <div>
          <div className="muted">
            {timing === 'asap' && avail.kind === 'now'
              ? moment.avgResponseMin > 0
                ? `尽快 · 平均响应时长 ${avail.waitMin} 分钟内开始`
                : '尽快 · 新发布'
              : slotId
                ? `预约 · ${moment.slots.find((s) => s.id === slotId)?.label}`
                : '预约 · 请选择时间'}
            {quantity > 1 ? ` · ×${quantity} 份` : ''}
          </div>
          <strong>¥{totalPrice.toFixed(1)}</strong>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!scheduledReady}
          onClick={() => {
            const order = createPendingOrder({
              momentId: moment.id,
              slotId: timing === 'asap' ? ASAP_SLOT_ID : slotId,
              payMethod,
              timing,
              quantity,
            });
            if (!order) {
              setError('创建失败：名额不足，未扣款');
              return;
            }
            navigate(`/pay/${order.id}`);
          }}
        >
          去支付
        </button>
      </div>
    </div>
  );
}
