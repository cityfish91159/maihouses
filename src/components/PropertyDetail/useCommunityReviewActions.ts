import { useCallback } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { getCurrentPath, navigateToAuth } from '../../lib/authUtils';
import { ROUTES, RouteUtils } from '../../constants/routes';
import { SEED_COMMUNITY_ID } from '../../constants/seed';
import { notify } from '../../lib/notify';
import { useModeAwareAction } from '../../hooks/useModeAwareAction';
import {
  REGISTER_GUIDE_TITLE,
  REGISTER_GUIDE_DESCRIPTION,
  LIKE_ACTION_ERROR_TITLE,
} from '../../constants/communityReview';

export interface UseCommunityReviewActionsOptions {
  communityId?: string | undefined;
  isDemoMode: boolean;
  isLoggedIn: boolean;
  onToggleLike?: (propertyId: string) => void;
  toggleLocalLike: (propertyId: string) => void;
}

export function useCommunityReviewActions({
  communityId,
  isDemoMode,
  isLoggedIn,
  onToggleLike,
  toggleLocalLike,
}: UseCommunityReviewActionsOptions) {
  const navigate = ReactRouterDom.useNavigate();

  const handleAuthRedirect = useCallback(() => navigateToAuth('login', getCurrentPath()), []);
  const handleSignupRedirect = useCallback(() => navigateToAuth('signup', getCurrentPath()), []);

  const handleCommunityWall = useCallback(() => {
    const targetId = communityId ?? (isDemoMode ? SEED_COMMUNITY_ID : null);
    if (targetId) {
      navigate(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(targetId)));
    } else {
      notify.info('暫時無法前往社區牆', '目前缺少社區識別資料，請稍後再試。');
    }
  }, [communityId, isDemoMode, navigate]);

  const dispatchToggleLike = useModeAwareAction<string>({
    visitor: () => {
      notify.info(REGISTER_GUIDE_TITLE, REGISTER_GUIDE_DESCRIPTION, {
        action: {
          label: '免費註冊',
          onClick: handleSignupRedirect,
        },
      });
    },
    demo: (propertyId) => toggleLocalLike(propertyId),
    live: (propertyId) => {
      if (!isLoggedIn) {
        notify.info('請先登入', '登入後即可鼓勵評價。', {
          action: {
            label: '前往登入',
            onClick: handleAuthRedirect,
          },
        });
        return;
      }
      onToggleLike?.(propertyId);
    },
  });

  const handleToggleLike = useCallback(
    (propertyId: string) => {
      void dispatchToggleLike(propertyId).then((result) => {
        if (!result.ok) {
          notify.error(LIKE_ACTION_ERROR_TITLE, result.error);
        }
      });
    },
    [dispatchToggleLike]
  );

  return { handleSignupRedirect, handleCommunityWall, handleToggleLike };
}
