import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import { fetchProductById, updateProduct } from "../api/productApi"

export default function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // 기존 상품 정보 불러오기
  useEffect(() => {
    fetchProductById(id).then((p) => {
      if (p) {
        setForm({
          title: p.title,
          description: p.description,
          price: p.price,
          stock: p.stock,
          status: p.status,
          category: p.category,
          brand: p.brand ?? "",
        })
      }
    })
  }, [id])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await updateProduct(id, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      })
      alert("수정 성공!")
      navigate("/products")
    } catch (err) {
      alert("수정 실패: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!form) {
    return (
      <PageContainer>
        <Header showBack title="상품 수정" showCart={false} />
        <p className="mx-auto w-full max-w-md py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Header showBack title="상품 수정" showCart={false} />
      <div className="mx-auto w-full max-w-md">

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-3 h-12 w-full rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
      >
        {submitting ? "수정 중..." : "수정 완료"}
      </button>

      <div className="flex flex-col gap-3 pt-4 pb-28">
        <label className="text-sm font-semibold text-foreground">상품명</label>
        <input value={form.title} onChange={update("title")} className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />

        <label className="text-sm font-semibold text-foreground">설명</label>
        <textarea value={form.description} onChange={update("description")} rows={3} className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-foreground">가격</label>
            <input value={form.price} onChange={update("price")} type="number" className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-foreground">재고</label>
            <input value={form.stock} onChange={update("stock")} type="number" className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />
          </div>
        </div>

        <label className="text-sm font-semibold text-foreground">상태</label>
        <input value={form.status} onChange={update("status")} className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />

        <label className="text-sm font-semibold text-foreground">카테고리</label>
        <input value={form.category} onChange={update("category")} className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />

        <label className="text-sm font-semibold text-foreground">브랜드</label>
        <input value={form.brand} onChange={update("brand")} className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />
      </div>
      </div>
    </PageContainer>
  )
}