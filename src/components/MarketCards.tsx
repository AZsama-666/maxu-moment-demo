import { getProvider } from '../data/catalog';
import type {
  CompanionListing,
  GroupListing,
  PersonListing,
} from '../data/marketMock';
import { GroupFeedCard } from './GroupFeedCard';
import { ProviderFeedCard } from './ProviderFeedCard';

function personTimeLabel(person: PersonListing): string {
  if (person.within15Min) {
    return person.earliestLabel
      ? `最早 ${person.earliestLabel} 可约`
      : '15 分钟内可约';
  }
  if (person.earliestLabel) return `最早 ${person.earliestLabel} 可约`;
  if (person.inBusiness) return '营业中 · 可预约';
  if (person.hasCompanion) return '今晚可约';
  return '查看可约时段';
}

function personFulfillmentLabel(person: PersonListing): string {
  if (person.has1v1 && person.hasCompanion) return '平台履约 · 陪玩可约';
  if (person.has1v1) return '平台履约 · 预约时间';
  if (person.hasCompanion) return '1V1 · 双方确认交割';
  return '专属 Moment';
}

export function PersonCard({ person }: { person: PersonListing }) {
  const serviceTags = person.offerTags.filter((tag) => tag !== '组局');
  const serviceLabel = serviceTags.join(' · ') || 'Moment';
  const title = `${person.name} · ${serviceLabel}`;
  const metaLabel = `${personTimeLabel(person)} · ${personFulfillmentLabel(person)}`;

  const tags: string[] = [];
  if (person.verified) tags.push('已认证');

  return (
    <ProviderFeedCard
      to={`/ta/${person.providerId}`}
      coverUrl={person.avatarUrl}
      coverColor={person.avatarColor}
      coverLetter={person.name.slice(0, 1)}
      title={title}
      metaLabel={metaLabel}
      tags={tags}
      priceLabel={`¥${person.fromPriceYuan.toFixed(person.fromPriceYuan % 1 ? 1 : 0)} 起`}
      ctaLabel="去看看"
    />
  );
}

export function GroupCard({ listing }: { listing: GroupListing }) {
  const host = getProvider(listing.hostProviderId);
  const verified = host?.verified ?? false;
  const visibleAvatars = (listing.participantAvatars ?? []).slice(0, 3);
  const coverUrl = listing.coverImageUrl ?? listing.avatarUrl;

  const hostTag = verified
    ? '已认证'
    : listing.hostBadge?.includes('主理')
      ? '主理'
      : listing.hostBadge;

  const mediaLabel =
    listing.joinedCount > 0
      ? `${listing.joinedCount}人参与`
      : `剩 ${listing.seatsLeft} 席`;

  return (
    <GroupFeedCard
      to={`/group/${listing.id}`}
      coverUrl={coverUrl}
      coverColor={listing.avatarColor}
      coverLetter="局"
      mediaLabel={mediaLabel}
      mediaAvatars={listing.joinedCount > 0 ? visibleAvatars : undefined}
      title={listing.title}
      timeLabel={listing.whenLabel}
      locationLabel={
        listing.distanceLabel
          ? `${listing.distanceLabel} ${listing.placeLabel}`
          : listing.placeLabel
      }
      hostName={listing.hostName}
      hostAvatarUrl={listing.avatarUrl}
      hostColor={listing.avatarColor}
      hostTag={hostTag}
      priceLabel={`¥${listing.priceYuan.toFixed(0)}`}
      ctaLabel="立即报名"
    />
  );
}

export function CompanionCard({ listing }: { listing: CompanionListing }) {
  const provider = getProvider(listing.providerId);
  const verified = provider?.verified ?? false;

  const tags: string[] = [];
  if (verified) tags.push('已认证');

  return (
    <ProviderFeedCard
      to={`/companion/${listing.id}`}
      coverUrl={listing.avatarUrl}
      coverColor={listing.avatarColor}
      coverLetter={listing.providerName.slice(0, 1)}
      title={listing.title}
      metaLabel={`${listing.whenLabel} · ${listing.placeLabel}`}
      tags={tags}
      priceLabel={`¥${listing.priceYuan.toFixed(0)} 起`}
      ctaLabel="立即下单"
    />
  );
}
