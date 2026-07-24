import { useNavigate } from "react-router-dom"
import { Tag, Gavel, ChevronRight, Clock } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"

export default function ProductCreateTypePage() {
  const navigate = useNavigate()

  return (
    <PageContainer noPadX>
      <Header showBack title="상품 등록" showCart={false} />

      <div className="mx-auto w-full max-w-md px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground text-balance">어떻게 판매할까요?</h1>
        <p className="mt-1 text-sm text-muted-foreground">판매 방식을 선택하면 등록 폼으로 이동합니다.</p>

        <div className="mt-5 flex flex-col gap-3">
          {/* Normal */}
          <button
            onClick={() => navigate("/products/create/normal")}
            className="flex items-center gap-4 rounded-2xl bg-card p-5 text-left ring-1 ring-border transition-shadow hover:shadow-md"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal">
              <Tag size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">일반 판매</p>
              <p className="mt-0.5 text-sm text-muted-foreground">정해진 가격으로 바로 판매해요.</p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </button>

          {/* Auction */}
          <button
            onClick={() => navigate("/products/create/auction")}
            className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-card p-5 text-left ring-2 ring-amber/40 transition-shadow hover:shadow-md"
          >
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber">
              <Clock size={11} /> 입찰 마감
            </span>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-soft text-amber">
              <Gavel size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">경매 등록</p>
              <p className="mt-0.5 text-sm text-muted-foreground">입찰을 받아 최고가에 판매해요.</p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </PageContainer>
  )
}
