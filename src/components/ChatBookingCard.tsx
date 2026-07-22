import { Link } from 'react-router-dom';
import type { BookingCardPayload } from '../data/chatMock';
import { bookingCardVariantLabel } from '../data/chatMock';

export type ChatBookingCardProps = {
  card: BookingCardPayload;
};

export function ChatBookingCard({ card }: ChatBookingCardProps) {
  const variantLabel = bookingCardVariantLabel(card.variant);

  return (
    <div className="chat-booking-card">
      <div className="chat-booking-card__head">
        <span className="chat-booking-card__pill">{variantLabel}</span>
        <span className="chat-booking-card__status">{card.statusLabel}</span>
      </div>
      <strong className="chat-booking-card__title">{card.title}</strong>
      {card.subtitle && (
        <p className="chat-booking-card__subtitle muted">{card.subtitle}</p>
      )}
      <div className="chat-booking-card__meta">
        <span>{card.whenLabel}</span>
        {card.placeLabel && <span> · {card.placeLabel}</span>}
        {card.priceYuan != null && (
          <span className="chat-booking-card__price">
            · ¥{card.priceYuan.toFixed(card.priceYuan % 1 === 0 ? 0 : 1)}
          </span>
        )}
      </div>
      <div className="chat-booking-card__actions">
        <Link to={card.primaryCta.to} className="btn btn--primary btn--sm btn--block">
          {card.primaryCta.label}
        </Link>
        {card.secondaryCta && (
          <Link to={card.secondaryCta.to} className="text-link chat-booking-card__secondary">
            {card.secondaryCta.label}
          </Link>
        )}
      </div>
    </div>
  );
}
