import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import PriceText from "../components/PriceText"
import { formatKRW } from "../lib/format"
import { fetchCart, removeCartItem, cleanCart } from "../api/cartApi"
import { fetchProductById } from "../api/productApi"

export default function CartPage() {
  const navigate = useNavigate()
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
              }
            }
          })
        )
        setItems(resolvedItems)
        setSelected(Object.fromEntries(resolvedItems.map((i) => [i.id, true])))
      } catch (err) {
        console.error("장바구니 로드 실패:", err)
      } finally {
        setLoading(false)
      }
    }

    loadCartData()
  }, [])

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const allChecked = items.length > 0 && items.every((i) => selected[i.id])
  const toggleAll = () => {
    const next = !allChecked
    setSelected(Object.fromEntries(items.map((i) => [i.id, next])))
  }

  const setQty = (id, delta) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)))

  const remove = async (id) => {
    if (!window.confirm("해당 상품을 장바구니에서 삭제하시겠습니까?")) return
    try {
      await removeCartItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      setSelected((s) => {
        const next = { ...s }
        delete next[id]
        return next
      })
    } catch (err) {
      alert("상품 삭제에 실패했습니다: " + err.message)
    }
  }

  const handleCleanCart = async () => {
    if (!window.confirm("장바구니를 완전히 비우시겠습니까?")) return
    try {
      await cleanCart()
      setItems([])
      setSelected({})
    } catch (err) {
      alert("장바구니 비우기에 실패했습니다: " + err.message)
    }
  }

  const selectedItems = items.filter((i) => selected[i.id])
  const total = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  const handleCreateOrder = () => {
    if (selectedItems.length === 0) return
    navigate("/orders", { state: { items: selectedItems, total } })
  }

  if (loading) {
    return (
      <PageContainer>
        <Header showBack title="장바구니" showCart={false} />
        <div className="mx-auto w-full max-w-md space-y-3 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (items.length === 0) {
    return (
      <PageContainer>
        <Header showBack title="장바구니" showCart={false} />
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 py-24 text-center">
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
    <PageContainer>
      <Header showBack title="장바구니" showCart={false} />
      <div className="mx-auto w-full max-w-md">

      <div className="flex items-center justify-between pt-3 pb-1">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-[#10b3b6]" />
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
              checked={!!selected[item.id]}
              onChange={() => toggle(item.id)}
              className="mt-1 h-4 w-4 accent-[#10b3b6]"
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
              <PriceText value={item.price} size="md" className="mt-1 text-foreground" />
              <div className="mt-auto flex items-center gap-2 self-end rounded-lg ring-1 ring-border">
                <button onClick={() => setQty(item.id, -1)} aria-label="수량 감소" className="grid h-7 w-7 place-items-center text-muted-foreground">
                  <Minus size={14} />
                </button>
                <span className="min-w-5 text-center text-sm font-semibold">{item.qty}</span>
                <button onClick={() => setQty(item.id, 1)} aria-label="수량 증가" className="grid h-7 w-7 place-items-center text-muted-foreground">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Sticky total */}
      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3">
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
