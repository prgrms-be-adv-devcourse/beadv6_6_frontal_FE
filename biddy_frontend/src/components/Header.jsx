import { useNavigate } from "react-router-dom"
import { ChevronLeft, ShoppingCart, Bell, LogOut, LogIn, User, Shield } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function Header({ title, showBack = false, showCart = true, right = null }) {
  const navigate = useNavigate()
  const { logout, isAdmin, isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-30 bg-dark text-dark-foreground">
      <div className="relative mx-auto flex h-14 w-full max-w-md items-center px-4 lg:max-w-6xl">
        <div className="flex items-center gap-1">
          {title && (
            <span
              onClick={() => navigate("/")}
              className="shrink-0 text-base font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            >
              Bid<span className="text-teal">dy</span>
            </span>
          )}
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
            >
              <ChevronLeft size={22} />
            </button>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          {title ? (
            <h1 className="truncate text-base font-semibold">{title}</h1>
          ) : (
            <span
              onClick={() => navigate("/")}
              className="text-xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            >
              Bid<span className="text-teal">dy</span>
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {right}
          <button
            onClick={() => navigate("/mypage")}
            aria-label="마이페이지"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
          >
            <User size={20} />
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              aria-label="관리자 페이지"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
            >
              <Shield size={20} />
            </button>
          )}
          {showCart && (
            <>
              <button
                onClick={() => navigate("/")}
                aria-label="알림"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
              >
                <Bell size={20} />
              </button>
              <button
                onClick={() => navigate("/cart")}
                aria-label="장바구니"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
              >
                <ShoppingCart size={20} />
              </button>
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  aria-label="로그아웃"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
                >
                  <LogOut size={19} />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  aria-label="로그인"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-graydark"
                >
                  <LogIn size={19} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
