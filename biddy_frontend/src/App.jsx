import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import ProductListPage from "./pages/ProductListPage"
import ProductDetailPage from "./pages/ProductDetailPage"
import ProductCreateTypePage from "./pages/ProductCreateTypePage"
import ProductEditPage from "./pages/ProductEditPage"
import NormalProductCreatePage from "./pages/NormalProductCreatePage"
import AuctionProductCreatePage from "./pages/AuctionProductCreatePage"
import CartPage from "./pages/CartPage"
import OrderPage from "./pages/OrderPage"
import WalletPage from "./pages/WalletPage"
import MyPage from "./pages/Mypage"
import MyPageLayout from "./components/MyPageLayout"
import AdminPage from "./pages/AdminsPage"
import AdminRoute from "./components/AdminRoute"
import { DepositChargeFailPage, DepositChargeSuccessPage } from "./pages/DepositChargeResultPage"
import PaymentSuccessPage from "./pages/PaymentSuccessPage"
import PaymentFailPage from "./pages/PaymentFailPage"

export default function App() {
  return (
    <>
      <Routes>
        {/* 홈 = 상품 목록 (로그인 필요 — 비로그인 시 /login으로 이동) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProductListPage />
            </ProtectedRoute>
          }
        />
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
          <Route path="orders" element={<OrderPage embedded />} />
          <Route path="wallet" element={<WalletPage embedded />} />
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
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetailPage />
            </ProtectedRoute>
          }
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
