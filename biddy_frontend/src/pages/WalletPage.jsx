import { useEffect, useState } from "react"
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import { fetchWallet } from "../api/paymentApi"
import { formatDateTime, formatKRW } from "../lib/format"
import { requestDepositPayment } from "../lib/tossPayments"

const CHARGE_OPTIONS = [50000, 100000, 300000, 500000]

export default function WalletPage({ embedded = false }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [charging, setCharging] = useState(null)
  const [customAmount, setCustomAmount] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function loadWallet() {
      setLoading(true)
      setError("")
      try {
        const data = await fetchWallet()
        if (active) {
          setWallet(data)
        }
      } catch (err) {
        if (active) {
          setError(err.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadWallet()

    return () => {
      active = false
    }
  }, [])

  async function refreshWallet() {
    setLoading(true)
    setError("")
    try {
      setWallet(await fetchWallet())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCharge(amount) {
    if (!Number.isSafeInteger(amount) || amount < 1000) {
      setError("충전 금액은 1,000원 이상 입력해주세요.")
      return
    }
    setCharging(amount)
    setError("")
    try {
      await requestDepositPayment(amount)
    } catch (err) {
      if (err.code !== "USER_CANCEL") {
        setError(err.message)
      }
    } finally {
      setCharging(null)
    }
  }

  const normalizedCustomAmount = Number(customAmount)

  if (loading && !wallet) {
    const loadingContent = <div className="py-20 text-center text-sm text-muted-foreground">불러오는 중...</div>
    if (embedded) return loadingContent
    return (
      <>
        <Header title="내 지갑" />
        <PageContainer>
          <div className="mx-auto w-full max-w-md">{loadingContent}</div>
        </PageContainer>
      </>
    )
  }

  if (error && !wallet) {
    const errorContent = (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm font-semibold text-foreground">예치금 정보를 불러오지 못했습니다</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={refreshWallet}
          className="mt-2 flex h-10 items-center gap-2 rounded-lg bg-dark px-4 text-sm font-semibold text-dark-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          다시 불러오기
        </button>
      </div>
    )
    if (embedded) return errorContent
    return (
      <>
        <Header title="내 지갑" />
        <PageContainer>
          <div className="mx-auto w-full max-w-md">{errorContent}</div>
        </PageContainer>
      </>
    )
  }

  const history = [...(wallet?.transactions || [])].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime()
    const bTime = new Date(b.createdAt || 0).getTime()
    return bTime - aTime
  })

  const walletContent = (
    <>
      <div className={embedded ? "" : "py-4"}>
        {embedded && <h1 className="mb-4 text-xl font-extrabold text-foreground">지갑</h1>}
        {/* Balance card */}
          <div className="rounded-2xl bg-dark p-5 text-dark-foreground">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <WalletIcon className="h-4 w-4" />
              보유 예치금
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">{formatKRW(wallet?.balance || 0)}</p>
            <p className="mt-1 text-xs opacity-70">경매 입찰 및 즉시 구매에 사용할 수 있어요</p>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

          {/* Charge options */}
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-foreground">예치금 충전</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CHARGE_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleCharge(amount)}
                  disabled={charging != null}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
                >
                  {charging === amount ? (
                    "충전 중..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {formatKRW(amount)}
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  placeholder="직접 금액 입력"
                  className="h-12 w-full rounded-xl bg-card px-3.5 pr-9 text-sm text-foreground outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-teal"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  원
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCharge(normalizedCustomAmount)}
                disabled={
                  charging != null ||
                  customAmount.trim() === "" ||
                  !Number.isSafeInteger(normalizedCustomAmount) ||
                  normalizedCustomAmount < 1000
                }
                className="h-12 shrink-0 rounded-xl bg-teal px-4 text-sm font-semibold text-teal-foreground disabled:opacity-50"
              >
                충전하기
              </button>
            </div>
          </div>

          {/* History */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">거래 내역</h2>
              <button
                type="button"
                onClick={refreshWallet}
                disabled={loading}
                aria-label="거래 내역 새로고침"
                className="grid h-8 w-8 place-items-center rounded-full bg-card text-muted-foreground ring-1 ring-border disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="mt-3 rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                거래 내역이 없습니다
              </div>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {history.map((item) => {
                  const isPositive = item.kind === "in"
                  return (
                    <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                      <span
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                          isPositive ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-sm font-bold ${isPositive ? "text-teal" : "text-foreground"}`}
                      >
                        {isPositive ? "+" : "-"}
                        {formatKRW(item.amount)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
      </div>
    </>
  )

  if (embedded) return walletContent

  return (
    <>
      <Header title="내 지갑" />
      <PageContainer>
        <div className="mx-auto w-full max-w-md">{walletContent}</div>
      </PageContainer>
    </>
  )
}
