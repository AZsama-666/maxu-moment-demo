import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { demoSupplyOrderId } from '../../state/demoSeed';
import { getOrder } from '../../state/orderStore';
import { getSupplyListing } from '../../state/supplyStore';
import { providerWaitingPath } from '../../utils/orderPerspective';

export function LaunchSuccessPage() {
  const { id = '' } = useParams();
  const listing = getSupplyListing(id);

  if (!listing) {
    return (
      <div className="page">
        <PageHeader title="发布结果" backTo="/profile/my-moments" />
        <p className="empty">未找到刚发布的 Moment</p>
      </div>
    );
  }

  const buyerPath =
    listing.kind === 'companion' ? `/group/${listing.id}` : `/moment/${listing.id}`;
  const opposite =
    listing.kind === '1v1'
      ? listing.form === 'voice'
        ? 'video'
        : 'voice'
      : null;
  const isOpen = listing.status === 'open';
  const demoOrder =
    listing.kind === '1v1' ? getOrder(demoSupplyOrderId(listing.id)) : undefined;

  return (
    <div className="page page--center">
      <PageHeader title={isOpen ? '发布成功' : '保存成功'} backTo="/profile/my-moments" />
      <div className="done-card">
        <div className="done-check">✓</div>
        <h2>{isOpen ? 'Moment 已发布' : 'Moment 已保存'}</h2>
        <p className="muted">
          {isOpen
            ? demoOrder
              ? `访客买家已预约 ${demoOrder.slotLabel}，可直接体验供给方履约流程。`
              : `买家现在可以在市集看到「${listing.title}」。`
            : `「${listing.title}」仍为下架状态，可在管理页重新上架。`}
        </p>
        {demoOrder && isOpen && (
          <>
            <Link
              to="/profile/my-moments/tasks"
              className="btn btn--primary btn--block"
            >
              查看待处理任务
            </Link>
            <Link
              to={providerWaitingPath(demoOrder.id)}
              className="btn btn--ghost btn--block"
            >
              直接进入供给等待室
            </Link>
          </>
        )}
        <Link to="/profile/my-moments" className="btn btn--ghost btn--block">
          查看我的 Moment
        </Link>
        {isOpen && (
          <Link to={buyerPath} className="btn btn--ghost btn--block">
            查看买家页面
          </Link>
        )}
        {opposite && (
          <Link
            to="/profile/my-moments/launch/type"
            className="text-link center-link"
          >
            继续发起 1V1 {opposite === 'voice' ? '语音' : '视频'}
          </Link>
        )}
      </div>
    </div>
  );
}
