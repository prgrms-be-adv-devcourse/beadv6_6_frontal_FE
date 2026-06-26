import { NavLink, Outlet } from "react-router-dom"
import { User, ClipboardList, Wallet } from "lucide-react"
import Header from "./Header"
import PageContainer from "./PageContainer"

const navItems = [
  { to: "/mypage", label: "내 정보", icon: User, end: true },
  { to: "/mypage/orders", label: "거래내역", icon: ClipboardList, end: true },
  { to: "/mypage/wallet", label: "지갑", icon: Wallet, end: true },
]

// Mypage shell: persistent left sidebar (내 정보 / 거래내역 / 지갑) with the
// matching section rendered into <Outlet /> on the right.
export default function MyPageLayout() {
  return (
    <>
      <Header title="마이페이지" showCart={false} />
      <PageContainer noPadX>
        <div className="flex flex-col gap-6 px-4 py-6 sm:flex-row">
          <aside className="w-full shrink-0 sm:w-52">
            <nav className="flex gap-1 overflow-x-auto rounded-xl bg-card p-2 ring-1 ring-border sm:flex-col sm:overflow-visible">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive ? "bg-teal-soft text-teal" : "text-muted-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </PageContainer>
    </>
  )
}
