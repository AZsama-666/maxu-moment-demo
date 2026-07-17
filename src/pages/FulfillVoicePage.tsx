import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateOrderStatus, useOrder } from '../state/orderStore';

export function FulfillVoicePage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [left, setLeft] = useState(order?.durationSec ?? 60);
  const finished = useRef(false);

  useEffect(() => {
    if (!order) return;
    setLeft(order.durationSec);
    finished.current = false;
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const timer = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          if (!finished.current) {
            finished.current = true;
            updateOrderStatus(order.id, 'completed');
            navigate(`/done/${order.id}`, { replace: true });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [order, navigate]);

  if (!order) {
    return <div className="fulfill fulfill--voice"><p className="empty">订单不存在</p></div>;
  }

  const hangup = () => {
    if (finished.current) return;
    finished.current = true;
    updateOrderStatus(order.id, 'completed');
    navigate(`/done/${order.id}`, { replace: true });
  };

  return (
    <div className="fulfill fulfill--voice">
      <p className="fulfill__label">语音互动进行中</p>
      <div className="avatar avatar--xxl" style={{ background: '#3DB8A0' }}>
        {order.providerName.slice(0, 1)}
      </div>
      <h2>{order.providerName}</h2>
      <p className="muted">{order.title}</p>
      <div className="countdown">{formatSec(left)}</div>
      <p className="muted">网络良好 · {muted ? '已静音' : '麦克风开'}</p>

      <div className="fulfill__controls">
        <button type="button" className="ctrl" onClick={() => setMuted((m) => !m)}>
          {muted ? '取消静音' : '静音'}
        </button>
        <button type="button" className="ctrl ctrl--danger" onClick={hangup}>
          挂断
        </button>
        <button type="button" className="ctrl" disabled>
          举报
        </button>
      </div>
    </div>
  );
}

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
