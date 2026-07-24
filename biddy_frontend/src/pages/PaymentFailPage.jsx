import { useSearchParams, useNavigate } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import PageContainer from "../components/PageContainer"
import Header from "../components/Header"

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const code = searchParams.get("code")
  const message = searchParams.get("message")
  const tossOrderId = searchParams.get("orderId")

  return (
    <PageContainer withTabBar={false} noPadX>
      <Header title="결제 실패" showBack={false} showCart={false} />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-foreground mb-2">결제에 실패했습니다</h2>
          <p className="text-sm text-muted-foreground mb-6">
            고객님의 결제 요청을 처리하는 중 에러가 발생했습니다.
          </p>

          <div className="w-full rounded-2xl bg-card p-5 ring-1 ring-border text-left mb-8">
            {tossOrderId && (
              <div className="flex justify-between items-center py-2 border-b border-border text-sm">
                <span className="text-muted-foreground">주문 번호</span>
                <span className="font-semibold text-foreground">{tossOrderId.replace("order-", "")}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-border text-sm">
              <span className="text-muted-foreground">에러 코드</span>
              <span className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">{code || "UNKNOWN_ERROR"}</span>
            </div>
            <div className="flex flex-col gap-1 py-2 text-sm">
              <span className="text-muted-foreground">상세 사유</span>
              <span className="text-foreground text-xs leading-relaxed bg-muted p-2 rounded break-words">
                {message || "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도해 주세요."}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate("/cart", { replace: true })}
              className="h-12 w-full rounded-xl bg-teal font-semibold text-teal-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              장바구니로 돌아가기
            </button>
            <button
              onClick={() => navigate("/products", { replace: true })}
              className="h-12 w-full rounded-xl bg-card border border-border font-semibold text-foreground flex items-center justify-center hover:bg-muted transition-colors"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
