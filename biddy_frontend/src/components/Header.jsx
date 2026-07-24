import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ShoppingCart, LogOut, LogIn, User, Shield, Search, Wallet } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { fetchWallet } from "../api/paymentApi"
import { formatKRW } from "../lib/format"

export default function Header({ title, showBack = false, showCart = true, right = null, onBack = null }) {
  const navigate = useNavigate()
  const { logout, isAdmin, isAuthenticated } = useAuth()
  const isHomeStyle = !title && !showBack

  const [balance, setBalance] = useState(null)

  useEffect(() => {
    if (!isHomeStyle || !isAuthenticated) {
      setBalance(null)
      return
    }
    let active = true
    fetchWallet()
      .then((data) => {
        if (active) setBalance(data?.balance ?? null)
      })
      .catch(() => {
        if (active) setBalance(null)
      })
    return () => {
      active = false
    }
  }, [isHomeStyle, isAuthenticated])

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card text-foreground">
      <div className="relative mx-auto flex h-14 w-full max-w-md items-center gap-2 px-4 lg:max-w-6xl">
        <div className="flex min-w-0 items-center gap-1">
          {showBack && (
            <button
              onClick={onBack || (() => navigate(-1))}
              aria-label="뒤로 가기"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {isHomeStyle && (
            <span
              onClick={() => navigate("/")}
              className="shrink-0 text-xl font-extrabold tracking-tight text-teal cursor-pointer hover:opacity-80 transition-opacity"
            >
              Biddy
            </span>
          )}
        </div>

        {title && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="max-w-[55vw] truncate text-base font-semibold">{title}</h1>
          </div>
        )}

        <div className="ml-auto flex min-w-0 items-center gap-1">
          {right}

          {/* Sub-pages (back + title) only get the back button + optional `right` slot above —
              mypage/search/cart/logout live on the home header so sub-pages stay uncluttered. */}
          {isHomeStyle && (
            <>
              {isAuthenticated && balance != null && (
                <button
                  onClick={() => navigate("/wallet")}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-teal hover:text-teal transition-colors"
                >
                  <Wallet size={13} />
                  {formatKRW(balance)}
                </button>
              )}
              <button
                onClick={() => navigate("/search")}
                aria-label="검색"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => navigate("/mypage")}
                aria-label="마이페이지"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
              >
                <User size={20} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  aria-label="관리자 페이지"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
                >
                  <Shield size={20} />
                </button>
              )}
              {showCart && (
                <>
                  <button
                    onClick={() => navigate("/cart")}
                    aria-label="장바구니"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
                  >
                    <ShoppingCart size={20} />
                  </button>
                  {isAuthenticated ? (
                    <button
                      onClick={logout}
                      aria-label="로그아웃"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
                    >
                      <LogOut size={19} />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/login")}
                      aria-label="로그인"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
                    >
                      <LogIn size={19} />
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
