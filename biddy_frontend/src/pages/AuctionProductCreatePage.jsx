import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Gavel } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import ImageUploader from "../components/ImageUploader"
import { Field, Select } from "../components/FormField"
import { CATEGORIES } from "../api/mockData"
import { createAuctionProduct, uploadProductImages } from "../api/productApi"

function defaultEndsAt() {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-500">{msg}</p>
}

export default function AuctionProductCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: "",
    category: "한정판 굿즈",
    description: "",
    startPrice: "",
    minIncrement: "500",
    stock: "1",
    status: "ACTIVE",
    brand: "",
    endsAt: defaultEndsAt(),
  })
  const [imageFiles, setImageFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = "상품명을 입력하세요"
    if (!form.startPrice || Number(form.startPrice) <= 0) e.startPrice = "시작가는 0보다 커야 합니다"
    if (!form.minIncrement || Number(form.minIncrement) <= 0) e.minIncrement = "최소 입찰 단위는 0보다 커야 합니다"
    if (!form.endsAt) e.endsAt = "종료일시를 선택하세요"
    else if (new Date(form.endsAt) <= new Date()) e.endsAt = "종료일시는 현재 시각 이후여야 합니다"
    if (!form.description.trim()) e.description = "상품 설명을 입력하세요"
    if (imageFiles.length === 0) e.image = "상품 이미지를 1장 이상 등록하세요"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!validate()) return
    setSubmitting(true)
    let created
    try {
      created = await createAuctionProduct({
        ...form,
        price: Number(form.startPrice),
        startPrice: Number(form.startPrice),
        minIncrement: Number(form.minIncrement),
        stock: Number(form.stock),
        startsAt: new Date().toISOString().slice(0, 19),
        endsAt: form.endsAt,
      })
    } catch (err) {
      setSubmitError(err.message || "등록에 실패했습니다")
      setSubmitting(false)
      return
    }

    if (imageFiles.length > 0) {
      try {
        await uploadProductImages(created.id, imageFiles)
        alert("경매 상품 등록 성공!")
      } catch (err) {
        alert("상품은 등록되었지만 이미지 업로드에 실패했습니다: " + err.message)
      }
    } else {
      alert("경매 상품 등록 성공!")
    }
    setSubmitting(false)
    navigate("/products")
  }

  const inputCls = (key) =>
    `rounded-lg bg-card px-3 py-2.5 ring-1 ${errors[key] ? "ring-red-500" : "ring-border"}`

  return (
    <PageContainer noPadX>
      <Header showBack title="경매 상품 등록" showCart={false} />
      <div className="mx-auto w-full max-w-md px-4">

      {submitError && (
        <div className="mt-3 rounded-xl bg-red-500/10 px-3.5 py-3 text-sm text-red-500">{submitError}</div>
      )}

      <div className="flex flex-col gap-4 pt-4 pb-40">
        <Field label="상품 이미지 *" hint="최대 5장">
          <ImageUploader onFilesChange={(files) => { setImageFiles(files); setErrors((prev) => ({ ...prev, image: null })) }} />
          <ErrorMsg msg={errors.image} />
        </Field>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">상품명 *</label>
          <input value={form.title} onChange={update("title")} placeholder="상품명을 입력하세요" className={inputCls("title")} />
          <ErrorMsg msg={errors.title} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">카테고리</label>
          <Select value={form.category} onChange={update("category")} options={CATEGORIES.filter((c) => c !== "전체")} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">상품 설명 *</label>
          <textarea value={form.description} onChange={update("description")} rows={4} placeholder="상품의 상태, 구성품 등을 자세히 적어주세요." className={inputCls("description")} />
          <ErrorMsg msg={errors.description} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-foreground">시작가 *</label>
            <input value={form.startPrice} onChange={update("startPrice")} type="number" placeholder="5000" className={inputCls("startPrice")} />
            <ErrorMsg msg={errors.startPrice} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-foreground">최소 입찰 단위 *</label>
            <input value={form.minIncrement} onChange={update("minIncrement")} type="number" placeholder="500" className={inputCls("minIncrement")} />
            <ErrorMsg msg={errors.minIncrement} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">경매 종료일시 *</label>
          <input value={form.endsAt} onChange={update("endsAt")} type="datetime-local" className={inputCls("endsAt")} />
          <ErrorMsg msg={errors.endsAt} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">브랜드</label>
          <input value={form.brand} onChange={update("brand")} placeholder="브랜드" className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border" />
        </div>

      </div>
      <div className="fixed bottom-16 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3 lg:bottom-0">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
        >
          <Gavel size={18} />
          {submitting ? "등록 중..." : "경매 상품 등록"}
        </button>
      </div>
      </div>
    </PageContainer>
  )
}
