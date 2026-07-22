import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CheckoutPage } from './pages/CheckoutPage';
import { DetailPage } from './pages/DetailPage';
import { DonePage } from './pages/DonePage';
import { FeedPage } from './pages/FeedPage';
import { FulfillVideoPage } from './pages/FulfillVideoPage';
import { FulfillVoicePage } from './pages/FulfillVoicePage';
import { GroupConfirmPage } from './pages/GroupConfirmPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { GroupPayPage } from './pages/GroupPayPage';
import { CompanionDetailPage } from './pages/CompanionDetailPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { HomePage } from './pages/HomePage';
import { MessagesPage } from './pages/MessagesPage';
import { OrdersPage } from './pages/OrdersPage';
import { PayPage } from './pages/PayPage';
import { MyMomentsPage } from './pages/MyMomentsPage';
import { PendingAcceptPage } from './pages/PendingAcceptPage';
import {
  CategoryPage,
  NotFoundPage,
  PublishPage,
  TaMomentPage,
} from './pages/PlaceholderPages';
import { ProfilePage } from './pages/ProfilePage';
import { SupplyManagePage } from './pages/SupplyManagePage';
import { SupplyTasksPage } from './pages/SupplyTasksPage';
import { SupplyWaitingPage } from './pages/supply/SupplyWaitingPage';
import { SupplyFulfillVoicePage } from './pages/supply/SupplyFulfillVoicePage';
import { SupplyFulfillVideoPage } from './pages/supply/SupplyFulfillVideoPage';
import { WaitingPage } from './pages/WaitingPage';
import { LaunchFulfillmentPage } from './pages/launch/LaunchFulfillmentPage';
import { LaunchPreviewPage } from './pages/launch/LaunchPreviewPage';
import { LaunchProductPage } from './pages/launch/LaunchProductPage';
import { LaunchSuccessPage } from './pages/launch/LaunchSuccessPage';
import { LaunchTypePage } from './pages/launch/LaunchTypePage';
import { LegacyCreateMomentRedirect } from './pages/launch/LegacyCreateMomentRedirect';
import { useHydrateStore } from './state/orderStore';

export default function App() {
  useHydrateStore();

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <div className="app-root">
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/chat/:chatId" element={<ChatRoomPage />} />
            <Route path="messages/dm/:providerId" element={<ChatRoomPage />} />
            <Route path="publish" element={<PublishPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/orders" element={<OrdersPage />} />
            <Route path="profile/my-moments" element={<MyMomentsPage />} />
            <Route path="profile/my-moments/create" element={<LegacyCreateMomentRedirect />} />
            <Route path="profile/my-moments/launch/type" element={<LaunchTypePage />} />
            <Route path="profile/my-moments/launch/product" element={<LaunchProductPage />} />
            <Route path="profile/my-moments/launch/fulfillment" element={<LaunchFulfillmentPage />} />
            <Route path="profile/my-moments/launch/preview" element={<LaunchPreviewPage />} />
            <Route path="profile/my-moments/launch/success/:id" element={<LaunchSuccessPage />} />
            <Route path="profile/my-moments/tasks" element={<SupplyTasksPage />} />
            <Route path="profile/my-moments/:id/manage" element={<SupplyManagePage />} />
            <Route path="category/:key" element={<CategoryPage />} />
            <Route path="moment/:momentId" element={<DetailPage />} />
            <Route path="group/:groupId" element={<GroupDetailPage />} />
            <Route path="companion/:companionId" element={<CompanionDetailPage />} />
            <Route path="group-pay/:orderId" element={<GroupPayPage />} />
            <Route path="group-order/:orderId" element={<GroupConfirmPage />} />
            <Route path="ta/:providerId" element={<TaMomentPage />} />
            <Route path="checkout/:momentId" element={<CheckoutPage />} />
            <Route path="pay/:orderId" element={<PayPage />} />
            <Route path="pending-accept/:orderId" element={<PendingAcceptPage />} />
            <Route path="waiting/:orderId" element={<WaitingPage />} />
            <Route path="supply/waiting/:orderId" element={<SupplyWaitingPage />} />
            <Route path="fulfill/voice/:orderId" element={<FulfillVoicePage />} />
            <Route path="fulfill/video/:orderId" element={<FulfillVideoPage />} />
            <Route
              path="supply/fulfill/voice/:orderId"
              element={<SupplyFulfillVoicePage />}
            />
            <Route
              path="supply/fulfill/video/:orderId"
              element={<SupplyFulfillVideoPage />}
            />
            <Route path="done/:orderId" element={<DonePage />} />
            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
