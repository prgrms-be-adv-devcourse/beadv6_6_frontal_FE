import { useEffect, useState, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { confirmPayment } from "../api/paymentApi"
import { removeCartItem } from "../api/cartApi"
import { formatKRW } from "../lib/format"
import PageContainer from "../components/PageContainer"
import Header from "../components/Header"
import { PENDING_ORDER_PAYMENT_PREFIX } from "../lib/tossPayments"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const hasCalled = useRef(false)

  const paymentMethod = searchParams.get("paymentMethod")
  const paymentKey = searchParams.get("paymentKey")
  const tossOrderId = searchParams.get("orderId")
  const amountStr = searchParams.get("amount")

  const [status, setStatus] = useState("processing") // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("")
  const [paymentDetails, setPaymentDetails] = useState(null)

  useEffect(() => {
    if (paymentMethod === "WALLET") {
      if (!tossOrderId || !amountStr) {
        setStatus("error")
        setErrorMessage("결제 정보가 올바르지 않습니다.")
        return
      }
      setPaymentDetails({ orderId: tossOrderId })
      setStatus("success")
      return
    }

    if (!paymentKey || !tossOrderId || !amountStr) {
      setStatus("error")
      setErrorMessage("결제 정보가 올바르지 않습니다.")
      return
    }

    if (hasCalled.current) return
    hasCalled.current = true

    const amount = Number(amountStr)
    let pending = null
    try {
      pending = JSON.parse(
        window.localStorage.getItem(`${PENDING_ORDER_PAYMENT_PREFIX}${tossOrderId}`) || "null",
      )
    } catch {
      window.localStorage.removeItem(`${PENDING_ORDER_PAYMENT_PREFIX}${tossOrderId}`)
    }

    const orderId = Number(pending?.orderId)
    if (!pending || !Number.isSafeInteger(orderId) || Number(pending.amount) !== amount) {
      setStatus("error")
      setErrorMessage("요청한 주문 정보와 Toss 결제 결과가 일치하지 않습니다.")
      return
    }

    const payload = {
      orderId,
      amount,
      paymentMethod: "NORMAL",
      paymentKey,
      tossOrderId,
    }

    setStatus("processing")

    confirmPayment(payload)
      .then((res) => {
        setPaymentDetails(res)
        setStatus("success")
        window.localStorage.removeItem(`${PENDING_ORDER_PAYMENT_PREFIX}${tossOrderId}`)
        if (pending && pending.cartItemIds && pending.cartItemIds.length > 0) {
          Promise.all(
            pending.cartItemIds.map((id) =>
              removeCartItem(id).catch((err) =>
                console.error("Failed to remove cart item:", err),
              ),
            ),
          ).catch((cartErr) => {
            console.error("결제 성공 후 장바구니 아이템 삭제 실패:", cartErr)
          })
        }
      })
      .catch((err) => {
        console.error("결제 승인 오류:", err)
        setStatus("error")
        setErrorMessage(err.message || "결제 승인 처리 중 오류가 발생했습니다.")
      })
  }, [paymentMethod, paymentKey, tossOrderId, amountStr])

  return (
    <PageContainer withTabBar={false} noPadX>
      <Header title="결제 처리" showBack={false} showCart={false} />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
        {status === "processing" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-teal animate-spin" />
            <h2 className="text-lg font-bold text-foreground">결제 승인 중</h2>
            <p className="text-sm text-muted-foreground">
              토스페이먼츠와 연동하여 결제를 승인하고 있습니다.<br />
              잠시만 기다려 주세요.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="w-full max-w-sm flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-teal mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-foreground mb-2">결제가 완료되었습니다!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              주문이 성공적으로 처리되었습니다.
            </p>

            <div className="w-full rounded-2xl bg-card p-5 ring-1 ring-border text-left mb-8">
              <div className="flex justify-between items-center py-2 border-b border-border text-sm">
                <span className="text-muted-foreground">주문 번호</span>
                <span className="font-semibold text-foreground">{paymentDetails?.orderId || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border text-sm">
                <span className="text-muted-foreground">결제 금액</span>
                <span className="font-bold text-teal">{formatKRW(Number(amountStr))}</span>
              </div>
              {paymentKey && (
                <div className="flex flex-col gap-1 py-2 text-xs">
                  <span className="text-muted-foreground">결제 키</span>
                  <span className="text-foreground break-all bg-muted p-1.5 rounded">{paymentKey}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/orders", { replace: true })}
              className="h-12 w-full rounded-xl bg-teal font-semibold text-teal-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              주문 내역 보기
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="w-full max-w-sm flex flex-col items-center text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">결제 승인에 실패했습니다</h2>
            <p className="text-sm text-muted-foreground mb-6">
              오류 메시지: {errorMessage}
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate("/cart", { replace: true })}
                className="h-12 w-full rounded-xl bg-teal font-semibold text-teal-foreground flex items-center justify-center"
              >
                장바구니로 돌아가기
              </button>
              <button
                onClick={() => navigate("/products", { replace: true })}
                className="h-12 w-full rounded-xl bg-card border border-border font-semibold text-foreground flex items-center justify-center"
              >
                홈으로 이동
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
