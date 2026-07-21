import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookingTimePicker } from '../components/BookingTimePicker';
import { getMoment, getProvider } from '../data/catalog';
import { buyerAvailability, providerHeroUrl } from '../data/mock';
import type { BookableSlot } from '../utils/bookingSlots';
import { getRemainingStock } from '../state/orderStore';
import { useSupplyTick } from '../state/supplyStore';
import { isNearTermSchedule, migrateScheduleFields } from '../utils/bookingSlots';

export function DetailPage() {
  useSupplyTick();
  const { momentId = '' } = useParams();
  const navigate = useNavigate();
  const moment = getMoment(momentId);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);

  if (!moment) {
    return (
      <div className="page">
        <div className="page-header">
          <Link to="/" className="page-header__back" aria-label="返回">
            ‹
          </Link>
          <h1>Moment 详情</h1>
          <span className="page-header__spacer" />
        </div>
        <p className="empty">未找到该 Moment</p>
      </div>
    );
  }

  const provider = getProvider(moment.providerId);
  if (!provider) {
    return (
      <div className="page">
        <div className="page-header">
          <Link to="/" className="page-header__back" aria-label="返回">
            ‹
          </Link>
          <h1>Moment 详情</h1>
          <span className="page-header__spacer" />
        </div>
        <p className="empty">供给方不存在</p>
      </div>
    );
  }

  const avail = buyerAvailability(moment, new Date(), getRemainingStock);
  const heroUrl = providerHeroUrl(provider);
  const schedule = migrateScheduleFields(moment);
  const nearTerm = isNearTermSchedule(schedule);

  return (
    <div className="page page--detail">
      <div
        className="detail-cover"
        style={
          heroUrl
            ? undefined
            : {
                background: `linear-gradient(165deg, ${provider.avatarColor} 0%, ${provider.avatarColor}b8 38%, #0f172a 100%)`,
              }
        }
      >
        {heroUrl && (
          <img className="detail-cover__img" src={heroUrl} alt="" />
        )}
        <Link to={`/ta/${provider.id}`} className="detail-cover__back" aria-label="返回">
          ‹
        </Link>
        <div className="detail-cover__shade" aria-hidden />
        {!heroUrl && (
          <div className="detail-cover__letter" aria-hidden>
            {provider.name.slice(0, 1)}
          </div>
        )}
        <div className="detail-cover__info">
          <div className="detail-cover__name-row">
            <strong>{provider.name}</strong>
            {provider.verified && <span className="badge badge--on-dark">已认证</span>}
          </div>
          <p className="detail-cover__bio">{provider.bio}</p>
          <div className="detail-cover__stats">
            <span>已履约 {moment.fulfilledCount}</span>
            <span>T+{schedule.bufferMin} 分钟起可约</span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <h2 className="detail-title">{moment.title}</h2>
        <div className="meta-row">
          <span className="pill">{moment.sceneTag}</span>
          <span>时长 {moment.durationSec} 秒</span>
          <span>¥{moment.priceYuan.toFixed(1)}</span>
        </div>
        <p className="body-text">{moment.description}</p>

        <section className="section">
          <h3 className="section__title">可订时间</h3>
          {avail.kind === 'available' ? (
            <>
              <p className="section__desc">
                最早 {avail.earliestLabel} 可约 · 间隔 {schedule.slotIntervalMin} 分钟
              </p>
              <BookingTimePicker
                moment={moment}
                selectedSlotId={selectedSlot?.id}
                onSelect={setSelectedSlot}
              />
            </>
          ) : (
            <p className="empty-inline">已约满或暂停可约，晚点再来看看</p>
          )}
        </section>

        <section className="section">
          <h3 className="section__title">履约须知</h3>
          <ul className="rules">
            <li>购买即锁定所选时段，到点进入等待室履约。</li>
            {nearTerm ? (
              <li>
                近档（N &lt; 60 分钟）：到点前 3 分钟供给未就绪可申请退款；到点未履约自动退。
              </li>
            ) : (
              <li>远档（N ≥ 60 分钟）：付款后需供给方确认预约后生效。</li>
            )}
            <li>本 Demo 为网页模拟，不产生真实扣款与通话。</li>
          </ul>
        </section>

        <div className="bottom-cta">
          <div>
            <div className="muted">
              {selectedSlot
                ? `已选 ${selectedSlot.displayLabel}`
                : avail.kind === 'available'
                  ? `最早 ${avail.earliestLabel} 可约`
                  : '已约满'}
            </div>
            <strong>¥{moment.priceYuan.toFixed(1)}</strong>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={avail.kind === 'full' || !selectedSlot}
            onClick={() => {
              if (!selectedSlot) return;
              navigate(
                `/checkout/${moment.id}?slot=${encodeURIComponent(selectedSlot.id)}`,
              );
            }}
          >
            去下单
          </button>
        </div>

        <p className="footer-note">
          也可先去 <Link to={`/ta/${provider.id}`}>TA 的 Moment</Link> 查看主页。
        </p>
      </div>
    </div>
  );
}
