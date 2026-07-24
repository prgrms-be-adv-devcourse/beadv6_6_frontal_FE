import { Outlet } from "react-router-dom"
import PageContainer from "./PageContainer"

// Mypage shell — just a routing passthrough now. Each section under /mypage
// (index, products, orders, wallet, settings) brings its own Header, since
// they're reached either from the bottom tab (no back button) or from the
// 마이페이지 hub's shortcut tiles (back button, like a chat room).
export default function MyPageLayout() {
  return (
    <PageContainer noPadX>
      <Outlet />
    </PageContainer>
  )
}
