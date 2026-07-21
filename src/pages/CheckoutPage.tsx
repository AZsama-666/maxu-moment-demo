import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useSelectedBookableSlot } from '../components/BookingTimePicker';
import { getMoment, getProvider } from '../data/catalog';
import { buyerAvailability } from '../data/mock';
import {
  createPendingOrder,
  getRemainingStock,
  MAX_ORDER_QTY,
  type PayMethod,
} from '../state/orderStore';
import { useSupplyTick } from '../state/supplyStore';

export function CheckoutPage() {
  useSupplyTick();
  const { momentId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const moment = getMoment(momentId);
  const slotId = params.get('slot') ?? '';
  const selectedSlot = useSelectedBookableSlot(moment, slotId || undefined);
  const [error, setError] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [quantity, setQuantity] = useState(1);

  const avail = moment
    ? buyerAvailability(moment, new Date(), getRemainingStock)
    : { kind: 'full' as const };

  const maxQty = useMemo(() => {
    if (!selectedSlot || selectedSlot.remaining <= 0) return 1;
    return Math.min(MAX_ORDER_QTY, selectedSlot.remaining);
  }, [selectedSlot]);

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

  if (avail.kind === 'full') {
    return (
      <div className="page">
        <PageHeader title="确认下单" backTo={`/moment/${moment.id}`} />
        <p className="empty">已约满，晚点再来看看</p>
      </div>
    );
  }

  if (!slotId || !selectedSlot || selectedSlot.remaining <= 0) {
    return <Navigate to={`/moment/${moment.id}`} replace />;
  }

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

      <section className="section">
        <h3 className="section__title">预约时间</h3>
        <div className="soft-card soft-card--static">
          <strong>{selectedSlot.displayLabel}</strong>
          <p className="muted">
            {moment.bufferMin < 60
              ? '近档：到点前 3 分钟供给未就绪可申请退款'
              : '远档：付款后需供给方确认预约'}
          </p>
        </div>
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
            预约 · {selectedSlot.displayLabel}
            {quantity > 1 ? ` · ×${quantity} 份` : ''}
          </div>
          <strong>¥{totalPrice.toFixed(1)}</strong>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            const order = createPendingOrder({
              momentId: moment.id,
              slotId: selectedSlot.id,
              payMethod,
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
