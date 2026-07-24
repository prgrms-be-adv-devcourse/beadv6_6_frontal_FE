import { Routes, Route, Navigate } from "react-router-dom"
import BottomTabBar from "./components/BottomTabBar"
import ProtectedRoute from "./components/ProtectedRoute"
import { useAuth } from "./contexts/AuthContext"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import ProductListPage from "./pages/ProductListPage"
import ProductDetailPage from "./pages/ProductDetailPage"
import ProductCreateTypePage from "./pages/ProductCreateTypePage"
import ProductEditPage from "./pages/ProductEditPage"
import NormalProductCreatePage from "./pages/NormalProductCreatePage"
import AuctionProductCreatePage from "./pages/AuctionProductCreatePage"
import AuctionFeedPage from "./pages/AuctionFeedPage"
import AuctionDetailPage from "./pages/AuctionDetailPage"
import MyBidsPage from "./pages/MyBidsPage"
import CartPage from "./pages/CartPage"
import OrderPage from "./pages/OrderPage"
import WalletPage from "./pages/WalletPage"
import MyPage from "./pages/Mypage"
import MyProductsPage from "./pages/MyProductsPage"
import SettingsPage from "./pages/SettingsPage"
import MyPageLayout from "./components/MyPageLayout"
import AdminPage from "./pages/AdminsPage"
import AdminRoute from "./components/AdminRoute"
import { DepositChargeFailPage, DepositChargeSuccessPage } from "./pages/DepositChargeResultPage"
import PaymentSuccessPage from "./pages/PaymentSuccessPage"
import PaymentFailPage from "./pages/PaymentFailPage"
import LikedProductsPage from "./pages/LikedProductsPage"
import ChatListPage from "./pages/ChatListPage"
import ChatRoomPage from "./pages/ChatRoomPage"
import SearchPage from "./pages/SearchPage"

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Routes>
        {/* 홈 = 상품 목록 (비로그인도 조회 가능) */}
        <Route path="/" element={<ProductListPage />} />
        <Route path="/products" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPageLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MyPage />} />
          <Route path="products" element={<MyProductsPage />} />
          <Route path="orders" element={<OrderPage embedded />} />
          <Route path="wallet" element={<WalletPage embedded />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/products/create"
          element={
            <ProtectedRoute>
              <ProductCreateTypePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/create/normal"
          element={
            <ProtectedRoute>
              <NormalProductCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/create/auction"
          element={
            <ProtectedRoute>
              <AuctionProductCreatePage />
            </ProtectedRoute>
          }
        />
          <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute>
              <ProductEditPage />
            </ProtectedRoute>
          }
        />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet/charge/success"
          element={
            <ProtectedRoute>
              <DepositChargeSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet/charge/fail"
          element={
            <ProtectedRoute>
              <DepositChargeFailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/success"
          element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/fail"
          element={
            <ProtectedRoute>
              <PaymentFailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/auctions" element={<ProtectedRoute><AuctionFeedPage /></ProtectedRoute>} />
        <Route path="/auctions/:auctionId" element={<ProtectedRoute><AuctionDetailPage /></ProtectedRoute>} />
        {/* 관심 경매는 찜 목록에 합쳐짐 */}
        <Route path="/my/watches" element={<Navigate to="/liked" replace />} />
        <Route path="/my/bids" element={<ProtectedRoute><MyBidsPage /></ProtectedRoute>} />
        <Route path="/liked" element={<ProtectedRoute><LikedProductsPage /></ProtectedRoute>} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/chats" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
        <Route path="/chats/:roomId" element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {isAuthenticated && <BottomTabBar />}
    </>
  )
}
