import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { X } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import ImageUploader from "../components/ImageUploader"
import { fetchProductById, updateProduct, uploadProductImages, deleteProductImage } from "../api/productApi"
import { useFeedback } from "../contexts/FeedbackContext"

export default function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const [form, setForm] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles] = useState([])
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
        setExistingImages(p.imageUrls ?? [])
      }
    })
  }, [id])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleRemoveExistingImage = async (url) => {
    try {
      await deleteProductImage(id, url)
      setExistingImages((imgs) => imgs.filter((img) => img !== url))
      showToast({ message: "이미지가 삭제되었습니다.", type: "success" })
    } catch (err) {
      showToast({ message: "이미지 삭제 실패: " + err.message, type: "error" })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await updateProduct(id, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      })
      if (newFiles.length > 0) {
        await uploadProductImages(id, newFiles)
      }
      showToast({ message: "상품이 수정되었습니다.", type: "success" })
      navigate("/products")
    } catch (err) {
      showToast({ message: "수정 실패: " + err.message, type: "error" })
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

      <div className="flex flex-col gap-3 pt-4 pb-40">
        <label className="text-sm font-semibold text-foreground">이미지</label>
        {existingImages.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {existingImages.map((url) => (
              <div key={url} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
                <img src={url} alt="상품 이미지" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(url)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-dark/80 text-dark-foreground"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageUploader max={5 - existingImages.length} onFilesChange={setNewFiles} />

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
      <div className="fixed bottom-16 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3 lg:bottom-0">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="h-12 w-full rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
        >
          {submitting ? "수정 중..." : "수정 완료"}
        </button>
      </div>
      </div>
    </PageContainer>
  )
}
