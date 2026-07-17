import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getTransferListing } from '../data/marketMock';

export function TransferPlaceholderPage() {
  const { transferId = '' } = useParams();
  const listing = getTransferListing(transferId);

  return (
    <div className="page">
      <PageHeader title="转约" backTo="/" />
      <div className="soft-card soft-card--static">
        <strong>{listing?.title ?? '转约'}</strong>
        <p className="muted" style={{ marginTop: 8 }}>
          {listing?.ruleHint ??
            '转约规则与交易能力首期未开放，仅作为市集入口占位。'}
        </p>
        <p className="pill" style={{ marginTop: 10 }}>
          {listing?.statusLabel ?? '即将开放'}
        </p>
        <Link to="/" className="btn btn--primary btn--block" style={{ marginTop: 14 }}>
          回到市集
        </Link>
      </div>
    </div>
  );
}
