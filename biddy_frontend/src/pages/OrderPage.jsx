import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Package, CreditCard, ShoppingBag, WalletCards } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import StatusBadge from "../components/StatusBadge"
import { fetchOrders, createOrder } from "../api/orderApi"
import { cleanCart } from "../api/cartApi"
import { createPayment, fetchDepositBalance, PAYMENT_METHOD } from "../api/paymentApi"
import { formatKRW, formatDate } from "../lib/format"
import { requestOrderPayment } from "../lib/tossPayments"

const ORDER_STATUS = {
  PENDING: { label: "결제 대기", variant: "amber" },
  PAID: { label: "결제 완료", variant: "teal" },
  SHIPPING: { label: "배송 중", variant: "amber" },
  DELIVERED: { label: "배송 완료", variant: "dark" },
  CANCELLED: { label: "취소됨", variant: "neutral" },
  COMPLETED: { label: "주문 완료", variant: "teal" },
}

export default function OrderPage({ embedded = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const checkoutData = location.state // { items, total }

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.WALLET)
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)

  // Load past orders only if not in checkout mode
  useEffect(() => {
    if (checkoutData) {
      setLoading(false)
      return
    }

    let active = true
    fetchOrders()
      .then((data) => {
        if (active) {
          setOrders(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("주문 목록 로드 실패:", err)
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [checkoutData])

  useEffect(() => {
    if (!checkoutData) return

    let active = true
    setWalletLoading(true)
    fetchDepositBalance()
      .then((data) => {
        if (active) setWalletBalance(Number(data?.balance ?? 0))
      })
      .catch((err) => {
        console.error("예치금 잔액 조회 실패:", err)
        if (active) setWalletBalance(null)
      })
      .finally(() => {
        if (active) setWalletLoading(false)
      })

    return () => {
      active = false
    }
  }, [checkoutData])

  const handleCheckout = async () => {
    if (!checkoutData || checkoutData.items.length === 0) return

    const amount = Number(checkoutData.total)
    if (paymentMethod === PAYMENT_METHOD.WALLET && walletBalance !== null && walletBalance < amount) {
      alert("예치금 잔액이 부족합니다. 예치금을 충전하거나 Toss 결제를 선택해 주세요.")
      return
    }
    
    setSubmitting(true)
    try {
      // 1. Build Order Request payload
      const payload = {
        items: checkoutData.items.map((item) => ({
          productId: item.productId,
          orderPrice: Number(item.price),
          quantity: Number(item.qty),
          sellerId: Number(item.sellerId),
        })),
      }

      // 2. Create the order in the backend
      const createdOrder = await createOrder(payload)
      
      if (createdOrder && createdOrder.id) {
        if (paymentMethod === PAYMENT_METHOD.WALLET) {
          await createPayment({
            orderId: createdOrder.id,
            amount,
            paymentMethod: PAYMENT_METHOD.WALLET,
          })
          await cleanCart()
          alert("예치금 결제가 완료되었습니다.")
          navigate("/orders", { replace: true })
          return
        }

        // Combine product titles for order name
        const orderName = checkoutData.items.map((item) => item.title).join(", ")
        await requestOrderPayment({
          orderId: createdOrder.id,
          amount,
          orderName,
        })
      }
      
    } catch (err) {
      console.error("주문 생성 실패:", err)
      alert("주문 처리에 실패했습니다: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    const loadingContent = <div className="py-20 text-center text-sm text-muted-foreground">불러오는 중...</div>
    if (embedded) return loadingContent
    return (
      <PageContainer>
        <Header showBack title={checkoutData ? "주문서 작성" : "주문 내역"} showCart={false} />
        <div className="mx-auto w-full max-w-md">{loadingContent}</div>
      </PageContainer>
    )
  }

  // --- Render Checkout Confirmation UI ---
  if (checkoutData) {
    return (
      <PageContainer>
        <Header showBack title="주문서 작성" showCart={false} />
        <div className="mx-auto w-full max-w-md">

        <div className="pt-3 pb-2 border-b border-border">
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <ShoppingBag size={18} className="text-[#10b3b6]" />
            주문 상품 정보
          </h2>
        </div>

        <ul className="flex flex-col gap-3 py-3">
          {checkoutData.items.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <h3 className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</h3>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatKRW(item.price)} × {item.qty}개</span>
                  <span className="text-sm font-semibold text-foreground">{formatKRW(item.price * item.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-3">
            <CreditCard size={16} className="text-[#10b3b6]" />
            결제 정보
          </h3>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-muted-foreground">총 상품 금액</span>
            <span className="font-semibold text-foreground">{formatKRW(checkoutData.total)}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-2">
            <span className="font-bold text-foreground">최종 결제 금액</span>
            <span className="text-lg font-extrabold text-[#10b3b6]">{formatKRW(checkoutData.total)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-border">
          <h3 className="mb-3 text-sm font-bold text-foreground">결제 수단</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod(PAYMENT_METHOD.WALLET)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                paymentMethod === PAYMENT_METHOD.WALLET
                  ? "border-[#10b3b6] bg-[#10b3b6]/10"
                  : "border-border bg-background"
              }`}
            >
              <WalletCards size={20} className="mb-2 text-[#10b3b6]" />
              <span className="block text-sm font-semibold text-foreground">예치금 결제</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {walletLoading
                  ? "잔액 확인 중..."
                  : walletBalance === null
                    ? "잔액 조회 실패"
                    : `잔액 ${formatKRW(walletBalance)}`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod(PAYMENT_METHOD.NORMAL)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                paymentMethod === PAYMENT_METHOD.NORMAL
                  ? "border-[#10b3b6] bg-[#10b3b6]/10"
                  : "border-border bg-background"
              }`}
            >
              <CreditCard size={20} className="mb-2 text-[#10b3b6]" />
              <span className="block text-sm font-semibold text-foreground">Toss 결제</span>
              <span className="mt-1 block text-xs text-muted-foreground">카드 등 일반 결제</span>
            </button>
          </div>
          {paymentMethod === PAYMENT_METHOD.WALLET &&
            walletBalance !== null &&
            walletBalance < Number(checkoutData.total) && (
              <p className="mt-3 text-xs font-medium text-rose-500">
                예치금이 {formatKRW(Number(checkoutData.total) - walletBalance)} 부족합니다.
              </p>
            )}
        </div>

        {/* Sticky Checkout button */}
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3">
          <button
            onClick={handleCheckout}
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting
              ? "결제 처리 중..."
              : `${paymentMethod === PAYMENT_METHOD.WALLET ? "예치금으로" : "Toss로"} ${formatKRW(checkoutData.total)} 결제하기`}
          </button>
        </div>
        </div>
      </PageContainer>
    )
  }

  // --- Render Past Orders List UI ---
  const ordersContent = (
    <>
      {!embedded && <h1 className="mb-4 text-xl font-extrabold text-foreground">거래내역</h1>}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">아직 주문 내역이 없어요</p>
          <Link
            to="/"
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-teal-foreground"
          >
            상품 보러가기
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 py-4">
          {orders.map((order) => {
            const status = ORDER_STATUS[order.status] || ORDER_STATUS.COMPLETED
            return (
              <li key={order.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                  <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
                </div>
                <div className="mt-3 flex gap-3">
                  <img
                    src={order.image || "/placeholder.svg"}
                    alt={order.title || "주문 상품"}
                    className="h-16 w-16 flex-shrink-0 rounded-lg border border-border object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="truncate text-sm font-medium text-foreground">{order.title || "상품 정보 없음"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">주문번호 {order.id}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">결제 금액</span>
                  <span className="text-sm font-bold text-foreground">{formatKRW(order.totalPrice || order.amount || 0)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )

  if (embedded) return ordersContent

  return (
    <>
      <Header title="주문 내역" />
      <PageContainer>
        <div className="mx-auto w-full max-w-md">{ordersContent}</div>
      </PageContainer>
    </>
  )
}
