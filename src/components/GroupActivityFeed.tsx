import { useSupplyListings } from '../state/supplyStore';
import { GroupCard } from './MarketCards';
import {
  GROUP_TRUST_HINT,
  listBrowseGroupListings,
} from '../data/marketMock';

export function GroupActivityFeed() {
  useSupplyListings();
  const groups = listBrowseGroupListings();

  return (
    <>
      <p className="section__desc" style={{ marginTop: 0 }}>
        {GROUP_TRUST_HINT}
      </p>
      {groups.length === 0 ? (
        <p className="empty">暂时没有开放的组局活动</p>
      ) : (
        <div className="stack stack--feed">
          {groups.map((listing) => (
            <GroupCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </>
  );
}
