import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Wallet as WalletIcon, Package, ClipboardList, Heart, Gavel, Settings } from "lucide-react"
import Header from "../components/Header"

import { getMyInfo } from "../api/memberApi"
import { fetchWallet } from "../api/paymentApi"
import { formatKRW } from "../lib/format"

const SHORTCUTS = [
  { to: "/mypage/products", label: "내 상품", icon: Package },
  { to: "/mypage/orders", label: "주문내역", icon: ClipboardList },
  { to: "/liked", label: "찜 목록", icon: Heart },
  { to: "/my/bids", label: "내 입찰", icon: Gavel },
  { to: "/mypage/wallet", label: "지갑", icon: WalletIcon },
  { to: "/mypage/settings", label: "설정", icon: Settings },
]

// Bottom-tab entry point for /mypage — its own Header (no back button), then
// 당근마켓/번개장터 "나의" 탭처럼 지갑/주문/판매/설정으로 가는 허브 타일들.
// 실제 계정 설정은 SettingsPage로 옮겼어요.
export default function MyPage() {
  const navigate = useNavigate()

  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    getMyInfo()
      .then(setInfo)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
    fetchWallet()
      .then((data) => setBalance(data?.balance ?? null))
      .catch(() => {})
  }, [])

  return (
    <>
      <Header title="마이페이지" showCart={false} />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-4">
          {info && (
            <section className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-foreground">{info.nickname || "회원"}</p>
                <p className="truncate text-xs text-muted-foreground">{info.email}</p>
              </div>
            </section>
          )}

          {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}

          {balance != null && (
            <section className="rounded-2xl bg-dark p-5 text-dark-foreground">
              <div className="flex items-center gap-2 text-sm opacity-80">
                <WalletIcon size={16} />
                보유 예치금
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight">{formatKRW(balance)}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate("/mypage/wallet")}
                  className="h-10 flex-1 rounded-xl bg-white/10 text-sm font-semibold hover:bg-white/20"
                >
                  내역보기
                </button>
                <button
                  onClick={() => navigate("/mypage/wallet")}
                  className="h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-dark"
                >
                  충전하기
                </button>
              </div>
            </section>
          )}

          <section className="grid grid-cols-3 gap-2.5">
            {SHORTCUTS.map(({ to, label, icon: Icon }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-4 text-foreground ring-1 ring-border transition-colors hover:text-teal hover:ring-teal"
              >
                <Icon size={20} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </section>
        </div>
      )}
    </>
  )
}
