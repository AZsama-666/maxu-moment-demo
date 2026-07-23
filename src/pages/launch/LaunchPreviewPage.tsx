import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SupplyLaunchProgress } from '../../components/SupplyLaunchProgress';
import { computeStatusLabel } from '../../data/mock';
import { GroupCard } from '../../components/MarketCards';
import type { GroupListing } from '../../data/marketMock';
import {
  clearLaunchDraft,
  draftScheduleConfig,
  draftToGroupCreateInput,
  useLaunchDraft,
} from '../../state/launchDraftStore';
import {
  createCompanionSupply,
  createGroupSupply,
  createSupplyMoment,
  getSupplyListing,
  updateCompanionSupply,
  updateGroupSupply,
} from '../../state/supplyStore';
import { spawnDemoSupplyOrderAfterPublish } from '../../state/orderStore';
import {
  getEarliestBookable,
  scheduleFromDraft,
} from '../../utils/bookingSlots';

export function LaunchPreviewPage() {
  const navigate = useNavigate();
  const draft = useLaunchDraft();
  const [submitting, setSubmitting] = useState(false);

  const previewLabel = useMemo(() => {
    if (draft.skuType === 'companion') return draft.serviceTime;
    if (draft.skuType === 'group') return draft.serviceTime;
    const config = scheduleFromDraft(draftScheduleConfig(draft));
    const earliest = getEarliestBookable('preview', config);
    if (!earliest) return draft.bookingOpen ? '已约满' : '暂停可约';
    return computeStatusLabel({
      id: 'preview',
      title: '',
      providerId: '',
      form: draft.skuType === 'video' ? 'video' : 'voice',
      sceneTag: '',
      description: '',
      durationSec: draft.durationSec,
      priceYuan: draft.priceYuan,
      statusLabel: '',
      fulfilledCount: 0,
      ...config,
    }).replace('最早 ', '').replace(' 可约', '');
  }, [draft]);

  const skuType = draft.skuType;
  const isCompanion = skuType === 'companion';
  const isGroup = skuType === 'group';

  const groupPreviewListing = useMemo((): GroupListing | null => {
    if (!isGroup) return null;
    return {
      kind: 'group',
      id: 'preview',
      hostProviderId: 'p-self',
      title: draft.title,
      hostName: '玛薯',
      avatarColor: '#4ADCC4',
      coverImageUrl: draft.coverImageUrl,
      whenLabel: draft.serviceTime,
      placeLabel: draft.placeLabel,
      distanceLabel: '3.2km',
      priceYuan: draft.priceYuan,
      seatsLeft: draft.seats,
      joinedCount: 0,
      hostBadge: draft.hostBadge,
      description: draft.description,
      intro: draft.intro,
      contentSections: draft.contentSections,
      hostOrganizedCount: draft.hostOrganizedCount,
      hostIntro: draft.hostIntro,
      refundPolicy: draft.refundPolicy,
      hostWechatId: draft.hostWechatId,
      joinNoteTemplate: draft.joinNoteTemplate,
    };
  }, [draft, isGroup]);

  if (!draft.skuType || !draft.title || draft.priceYuan <= 0) {
    return <Navigate to="/profile/my-moments/launch/type" replace />;
  }

  const publish = () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let id = '';
      if (skuType === 'group') {
        const input = draftToGroupCreateInput(draft);
        if (draft.editingId) {
          updateGroupSupply(draft.editingId, input);
          id = draft.editingId;
        } else {
          id = createGroupSupply(input).id;
        }
      } else if (skuType === 'companion') {
        if (draft.editingId) {
          const current = getSupplyListing(draft.editingId);
          const sold =
            current?.kind === 'companion'
              ? Math.max(0, current.seats - current.remaining)
              : 0;
          updateCompanionSupply(draft.editingId, {
            title: draft.title,
            description: draft.description,
            priceYuan: draft.priceYuan,
            unitLabel: draft.unitLabel,
            serviceTime: draft.serviceTime,
            placeLabel: draft.placeLabel,
            seats: draft.seats,
            remaining: Math.max(0, draft.seats - sold),
          });
          id = draft.editingId;
        } else {
          id = createCompanionSupply({
            title: draft.title,
            description: draft.description,
            priceYuan: draft.priceYuan,
            unitLabel: draft.unitLabel,
            serviceTime: draft.serviceTime,
            placeLabel: draft.placeLabel,
            seats: draft.seats,
          }).id;
        }
      } else if (skuType === 'voice' || skuType === 'video') {
        const schedule = draftScheduleConfig(draft);
        const listing = createSupplyMoment({
          form: skuType,
          title: draft.title,
          description: draft.description,
          durationSec: draft.durationSec,
          priceYuan: draft.priceYuan,
          ...schedule,
        });
        id = listing.id;
        if (!draft.editingId) {
          spawnDemoSupplyOrderAfterPublish(listing);
        }
      }
      clearLaunchDraft();
      navigate(`/profile/my-moments/launch/success/${id}`, { replace: true });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--launch">
      <PageHeader
        title="确认发布"
        backTo={`/profile/my-moments/launch/fulfillment?sku=${draft.skuType}`}
      />
      <SupplyLaunchProgress current={4} />
      <p className="section__desc">这是买家在市集里会看到的内容。</p>

      {isGroup && groupPreviewListing ? (
        <>
          <GroupCard listing={groupPreviewListing} />
          <div className="info-callout" style={{ marginTop: 12 }}>
            组局按约定到场完成活动，结束后由双方确认交割。主理人微信付款后可见。
          </div>
        </>
      ) : (
        <>
          <div className="moment-card launch-preview-card">
            <div
              className="moment-card__cover"
              style={{
                background:
                  'linear-gradient(160deg, #4ADCC4 0%, #4ADCC4cc 45%, #1a2332 100%)',
              }}
              aria-hidden
            >
              <span className="moment-card__cover-letter">玛</span>
            </div>
            <div className="moment-card__body">
              <div className="moment-card__row">
                <strong>玛薯</strong>
                <span className="badge">已认证</span>
                <span className="moment-card__wait">
                  {isCompanion ? draft.serviceTime : `最早 ${previewLabel} 可约`}
                </span>
              </div>
              <div className="moment-card__title">{draft.title}</div>
              <div className="moment-card__meta">
                {isCompanion ? (
                  <>
                    <span>陪玩</span>
                    <span>·</span>
                    <span>{draft.placeLabel}</span>
                    <span>·</span>
                    <span>剩 {draft.seats} 席</span>
                  </>
                ) : (
                  <>
                    <span>{draft.skuType === 'voice' ? '语音互动' : '视频互动'}</span>
                    <span>·</span>
                    <span>{draft.durationSec} 秒/份</span>
                  </>
                )}
              </div>
              <div className="moment-card__trust">
                {isCompanion ? (
                  <>
                    <span className="trust-chip">陪玩</span>
                    <span className="trust-chip muted-chip">线下交割</span>
                  </>
                ) : (
                  <>
                    <span className="trust-chip muted-chip">1V1</span>
                    <span className="trust-chip">可预约</span>
                    <span className="trust-chip muted-chip">
                      {draft.skuType === 'voice' ? '语音' : '视频'}
                    </span>
                  </>
                )}
              </div>
              <div className="moment-card__price">¥{draft.priceYuan.toFixed(1)}</div>
            </div>
          </div>
          <div className="info-callout" style={{ marginTop: 12 }}>
            {isCompanion
              ? '陪玩按约定完成服务，结束后由双方确认交割。'
              : '1V1 由平台内语音/视频完成履约，买家在详情页选择具体时段。'}
          </div>
        </>
      )}

      <div className="launch-bottom">
        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={submitting}
          onClick={publish}
        >
          {submitting ? '正在发布…' : draft.editingId ? '确认保存' : '确认发布'}
        </button>
      </div>
    </div>
  );
}
