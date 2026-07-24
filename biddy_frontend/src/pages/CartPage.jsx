import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import PriceText from "../components/PriceText"
import { formatKRW } from "../lib/format"
import { fetchCart, removeCartItem, cleanCart } from "../api/cartApi"
import { fetchProductById } from "../api/productApi"
import { useFeedback } from "../contexts/FeedbackContext"

export default function CartPage() {
  const navigate = useNavigate()
  const { showToast, confirmDialog } = useFeedback()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCartData = async () => {
      try {
        const cartList = await fetchCart()
        
        if (!cartList || cartList.length === 0) {
          setItems([])
          setSelected({})
          return
        }

        const resolvedItems = await Promise.all(
          cartList.map(async (item) => {
            try {
              const product = await fetchProductById(item.productId)
              return {
                id: item.id,
                productId: item.productId,
                title: product.name || product.title || "이름 없는 상품",
                price: product.price,
                sellerId: product.sellerId,
                qty: 1,
                image: product.image || null,
                createdAt: item.createdAt,
                stock: product.stock ?? 0,
              }
            } catch (err) {
              console.error(`상품 정보 로드 실패 (${item.productId}):`, err)
              return {
                id: item.id,
                productId: item.productId,
                title: "정보를 불러올 수 없는 상품",
                price: 0,
                qty: 1,
                image: null,
                createdAt: item.createdAt,
                error: true,
                stock: 0,
              }
            }
          })
        )
        setItems(resolvedItems)
        setSelected(Object.fromEntries(resolvedItems.map((i) => [i.id, i.stock > 0])))
      } catch (err) {
        console.error("장바구니 로드 실패:", err)
      } finally {
        setLoading(false)
      }
    }

    loadCartData()
  }, [])

  const toggle = (id) => {
    const item = items.find((i) => i.id === id)
    if (item && (item.stock ?? 0) <= 0) {
      showToast({ message: "품절된 상품은 주문할 수 없습니다.", type: "warning" })
      return
    }
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }
  const allChecked = items.length > 0 && items.filter((i) => (i.stock ?? 0) > 0).every((i) => selected[i.id])
  const toggleAll = () => {
    const next = !allChecked
    setSelected(Object.fromEntries(items.map((i) => [i.id, (i.stock ?? 0) > 0 ? next : false])))
  }

  const setQty = (id, delta) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const nextQty = i.qty + delta
          if (nextQty < 1) return i
          if (nextQty > (i.stock ?? 0)) {
            showToast({ message: `더 이상 수량을 늘릴 수 없습니다. (남은 재고: ${i.stock ?? 0}개)`, type: "warning" })
            return i
          }
          return { ...i, qty: nextQty }
        }
        return i
      })
    )

  const remove = async (id) => {
    const confirmed = await confirmDialog({
      title: "장바구니 상품 삭제",
      message: "해당 상품을 장바구니에서 삭제하시겠습니까?",
      confirmText: "삭제",
      variant: "danger",
    })
    if (!confirmed) return
    try {
      await removeCartItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      setSelected((s) => {
        const next = { ...s }
        delete next[id]
        return next
      })
      showToast({ message: "장바구니에서 삭제되었습니다.", type: "success" })
    } catch (err) {
      showToast({ message: "상품 삭제에 실패했습니다: " + err.message, type: "error" })
    }
  }

  const handleCleanCart = async () => {
    const confirmed = await confirmDialog({
      title: "장바구니 비우기",
      message: "장바구니를 완전히 비우시겠습니까?",
      confirmText: "비우기",
      variant: "danger",
    })
    if (!confirmed) return
    try {
      await cleanCart()
      setItems([])
      setSelected({})
      showToast({ message: "장바구니를 비웠습니다.", type: "success" })
    } catch (err) {
      showToast({ message: "장바구니 비우기에 실패했습니다: " + err.message, type: "error" })
    }
  }

  const selectedItems = items.filter((i) => selected[i.id])
  const total = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) return

    try {
      // 실시간 재고 정보 조회
      const stockChecks = await Promise.all(
        selectedItems.map(async (item) => {
          const product = await fetchProductById(item.productId)
          return {
            ...item,
            latestStock: product ? (product.stock ?? 0) : 0
          }
        })
      )

      // 재고가 부족한 상품 검출
      const insufficientItems = stockChecks.filter(item => item.qty > item.latestStock)

      if (insufficientItems.length > 0) {
        const firstBad = insufficientItems[0]
        if (firstBad.latestStock === 0) {
          showToast({
            message: `[${firstBad.title}] 상품이 품절되었습니다.`,
            type: "error"
          })
        } else {
          showToast({
            message: `[${firstBad.title}] 상품의 재고가 부족합니다. (주문 수량: ${firstBad.qty}개, 현재 재고: ${firstBad.latestStock}개)`,
            type: "error"
          })
        }

        // 실시간 재고 정보를 로컬 상태에 동기화 및 수량 보정
        setItems((prev) =>
          prev.map((i) => {
            const check = stockChecks.find(c => c.id === i.id)
            if (check) {
              const newStock = check.latestStock
              const newQty = Math.max(1, Math.min(i.qty, newStock))
              return { ...i, stock: newStock, qty: newStock > 0 ? newQty : i.qty }
            }
            return i
          })
        )

        // 품절된 경우 선택 해제
        setSelected((s) => {
          const next = { ...s }
          stockChecks.forEach(c => {
            if (c.latestStock <= 0) {
              next[c.id] = false
            }
          })
          return next
        })

        return
      }

      navigate("/orders", { state: { items: selectedItems, total } })
    } catch (err) {
      console.error("재고 확인 중 오류 발생:", err)
      showToast({ message: "재고 확인 중 오류가 발생했습니다. 다시 시도해 주세요.", type: "error" })
    }
  }

  if (loading) {
    return (
      <PageContainer noPadX>
        <Header showBack title="장바구니" showCart={false} />
        <div className="mx-auto w-full max-w-md space-y-3 px-4 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (items.length === 0) {
    return (
      <PageContainer noPadX>
        <Header showBack title="장바구니" showCart={false} />
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
            <ShoppingCart size={28} />
          </div>
          <p className="text-base font-semibold text-foreground">장바구니가 비어 있어요</p>
          <p className="text-sm text-muted-foreground">마음에 드는 상품을 담아보세요.</p>
          <button
            onClick={() => navigate("/products")}
            className="mt-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-teal-foreground"
          >
            상품 보러가기
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer noPadX>
      <Header showBack title="장바구니" showCart={false} />
      <div className="mx-auto w-full max-w-md px-4">

      <div className="flex items-center justify-between pt-3 pb-1">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-teal" />
          전체 선택 ({selectedItems.length}/{items.length})
        </label>
        <button 
          onClick={handleCleanCart} 
          className="text-xs font-semibold text-rose-500 hover:underline"
        >
          장바구니 비우기
        </button>
      </div>

      <ul className="flex flex-col gap-3 pb-40">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
            <input
              type="checkbox"
              checked={!!selected[item.id] && (item.stock ?? 0) > 0}
              disabled={(item.stock ?? 0) <= 0}
              onChange={() => toggle(item.id)}
              className="mt-1 h-4 w-4 accent-teal disabled:opacity-50"
              aria-label="상품 선택"
            />
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</h3>
                <button onClick={() => remove(item.id)} aria-label="삭제" className="text-muted-foreground">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <PriceText value={item.price} size="md" className="text-foreground" />
                {(item.stock ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    재고 {(item.stock ?? 0)}개
                  </span>
                )}
              </div>
              {(item.stock ?? 0) > 0 ? (
                <div className="mt-auto flex items-center gap-2 self-end rounded-lg ring-1 ring-border">
                  <button onClick={() => setQty(item.id, -1)} disabled={item.qty <= 1} aria-label="수량 감소" className="grid h-7 w-7 place-items-center text-muted-foreground disabled:opacity-30">
                    <Minus size={14} />
                  </button>
                  <span className="min-w-5 text-center text-sm font-semibold">{item.qty}</span>
                  <button onClick={() => setQty(item.id, 1)} disabled={item.qty >= (item.stock ?? 0)} aria-label="수량 증가" className="grid h-7 w-7 place-items-center text-muted-foreground disabled:opacity-30">
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <span className="mt-auto self-end text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">
                  품절
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Sticky total */}
      <div className="fixed bottom-16 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3 lg:bottom-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">선택 상품 {selectedItems.length}개</span>
          <span className="text-lg font-extrabold text-foreground">{formatKRW(total)}</span>
        </div>
        <button
          onClick={handleCreateOrder}
          disabled={selectedItems.length === 0}
          className="h-12 w-full rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
        >
          주문하기
        </button>
      </div>
      </div>
    </PageContainer>
  )
}
