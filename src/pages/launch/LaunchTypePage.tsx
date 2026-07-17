import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SupplyLaunchProgress } from '../../components/SupplyLaunchProgress';
import type { SkuType } from '../../data/mock';
import { selectDraftSku } from '../../state/launchDraftStore';
import {
  getListingBySkuType,
  type SupplyListing,
} from '../../state/supplyStore';

const skuOptions: Array<{
  type: SkuType;
  title: string;
  description: string;
  badge: string;
}> = [
  {
    type: 'voice',
    title: '1V1 语音',
    description: '在平台内与买家进行实时语音互动',
    badge: '平台履约',
  },
  {
    type: 'video',
    title: '1V1 视频',
    description: '在平台内与买家进行实时视频互动',
    badge: '平台履约',
  },
  {
    type: 'companion',
    title: '陪玩',
    description: '按约定完成服务，结束后双方确认交割',
    badge: '双方确认',
  },
];

function existingFor(type: SkuType): SupplyListing | undefined {
  const result = getListingBySkuType(type);
  return Array.isArray(result) ? undefined : result;
}

export function LaunchTypePage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <PageHeader title="选择 SKU" backTo="/profile/my-moments" />
      <SupplyLaunchProgress current={1} />
      <p className="section__desc">
        先选择你要提供的服务。语音、视频和陪玩分别独立管理。
      </p>

      <div className="launch-sku-list">
        {skuOptions.map((option) => {
          const existing = existingFor(option.type);
          return (
            <button
              key={option.type}
              type="button"
              className="launch-sku-card"
              onClick={() => {
                if (existing) {
                  navigate(`/profile/my-moments/${existing.id}/manage`);
                  return;
                }
                selectDraftSku(option.type);
                navigate(`/profile/my-moments/launch/product?sku=${option.type}`);
              }}
            >
              <span>
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </span>
              <span className="launch-sku-card__side">
                <span className="pill">{option.badge}</span>
                <small>{existing ? '已发起 · 去管理' : '去设置 ›'}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
