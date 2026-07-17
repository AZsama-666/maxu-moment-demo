import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { selectDraftSku } from '../../state/launchDraftStore';

export function LegacyCreateMomentRedirect() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const form = params.get('form');

  useEffect(() => {
    if (form === 'voice' || form === 'video') {
      selectDraftSku(form);
      navigate(`/profile/my-moments/launch/product?sku=${form}`, {
        replace: true,
      });
    } else {
      navigate('/profile/my-moments/launch/type', { replace: true });
    }
  }, [form, navigate]);

  return null;
}
