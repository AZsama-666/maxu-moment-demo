const steps = ['选择 SKU', '商品定价', '履约设置', '确认发布'] as const;

export function SupplyLaunchProgress({ current }: { current: number }) {
  return (
    <div className="launch-progress" aria-label={`第 ${current} 步，共 4 步`}>
      <div className="launch-progress__meta">
        <strong>发起 Moment</strong>
        <span>{current}/4</span>
      </div>
      <div className="launch-progress__bar">
        <span style={{ width: `${(current / steps.length) * 100}%` }} />
      </div>
      <p className="muted">{steps[current - 1]}</p>
    </div>
  );
}
