import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateOrderStatus, useOrder } from '../../state/orderStore';
import { getOrderPerspective } from '../../utils/orderPerspective';

export function SupplyFulfillVideoPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [left, setLeft] = useState(order?.durationSec ?? 60);
  const finished = useRef(false);

  useEffect(() => {
    if (!order) return;
    if (getOrderPerspective(order) !== 'provider') {
      navigate(`/fulfill/video/${order.id}`, { replace: true });
    }
  }, [order, navigate]);

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
            navigate('/profile/my-moments/tasks', { replace: true });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [order, navigate]);

  if (!order) {
    return (
      <div className="fulfill fulfill--video">
        <p className="empty">订单不存在</p>
      </div>
    );
  }

  const hangup = () => {
    if (finished.current) return;
    finished.current = true;
    updateOrderStatus(order.id, 'completed');
    navigate('/profile/my-moments/tasks', { replace: true });
  };

  return (
    <div className="fulfill fulfill--video">
      <div className="video-stage">
        <div className="video-remote">
          <div className="video-remote__mock">买家画面（模拟）</div>
          <div className="video-remote__name">{order.buyerName}</div>
        </div>
        <div className={`video-self ${camOff ? 'video-self--off' : ''}`}>
          {camOff ? '摄像头已关' : '我（供给方）'}
        </div>
        <div className="video-top">
          <span>正在服务 · {order.slotLabel}</span>
          <strong className="countdown countdown--sm">{formatSec(left)}</strong>
        </div>
      </div>

      <div className="fulfill__controls fulfill__controls--overlay">
        <button type="button" className="ctrl" onClick={() => setMuted((m) => !m)}>
          {muted ? '取消静音' : '静音'}
        </button>
        <button type="button" className="ctrl" onClick={() => setCamOff((c) => !c)}>
          {camOff ? '开摄像头' : '关摄像头'}
        </button>
        <button type="button" className="ctrl ctrl--danger" onClick={hangup}>
          结束服务
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
