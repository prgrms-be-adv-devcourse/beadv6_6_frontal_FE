import { Link, useNavigate } from "react-router-dom"
import { ChevronLeft, ShoppingCart, LogOut, LogIn, ShieldCheck, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

// Top navigation bar.
// Left: back button (subpages) or the Biddy logo linking home.
// Right: 로그인 when signed out; 장바구니 / 마이페이지 / 관리자 페이지(admin) / 로그아웃 when signed in.
export default function Header({ title, showBack = false, showCart = true }) {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate("/", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 bg-dark text-dark-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <Link to="/" className="text-xl font-extrabold tracking-tight">
              Bid<span className="text-teal">dy</span>
            </Link>
          )}
          {title && <h1 className="truncate text-base font-semibold">{title}</h1>}
        </div>

        <div className="flex items-center gap-1.5">
          {isAuthenticated ? (
            <>
              {showCart && (
                <button
                  onClick={() => navigate("/cart")}
                  aria-label="장바구니"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
                >
                  <ShoppingCart size={20} />
                </button>
              )}
              <Link
                to="/mypage"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-graydark"
              >
                <User size={16} />
                마이페이지
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-graydark"
                >
                  <ShieldCheck size={16} />
                  관리자 페이지
                </Link>
              )}
              <button
                onClick={handleLogout}
                aria-label="로그아웃"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg bg-teal px-3.5 py-1.5 text-sm font-semibold text-teal-foreground"
            >
              <LogIn size={16} />
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
