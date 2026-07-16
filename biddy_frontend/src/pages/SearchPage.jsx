import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, Sparkles, TrendingUp, Clock, X } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import {
  fetchHistoryRecommendations,
  fetchPopularKeywords,
  fetchSearchSuggestions,
  searchProducts,
} from "../api/searchApi"
import { useAuth } from "../contexts/AuthContext"

function getProductId(product) {
  return product?.productId ?? product?.id
}

function normalizeProduct(product) {
  return {
    id: getProductId(product),
    title: product?.name ?? product?.title ?? "상품명 없음",
    price: product?.price ?? 0,
    status: product?.status ?? "-",
    stock: product?.stock ?? 0,
    sellerId: product?.sellerId,
    similarityScore: product?.similarityScore,
    image: product?.image || product?.imageUrl || product?.imageUrls?.[0] || null,
  }
}

function KeywordButton({ children, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-sm font-semibold text-foreground ring-1 ring-border"
    >
      {Icon && <Icon size={14} className="text-teal" />}
      <span className="max-w-40 truncate">{children}</span>
    </button>
  )
}

function ProductResultCard({ product, reason, recommended = false }) {
  const navigate = useNavigate()
  const item = normalizeProduct(product)

  return (
    <button
      type="button"
      onClick={() => item.id && navigate(`/products/${item.id}`)}
      className="w-full overflow-hidden rounded-xl bg-card text-left ring-1 ring-border transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3 p-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-dark">
          {item.image ? (
            <>
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling.style.display = "flex"
                }}
              />
              <div className="hidden h-full w-full items-center justify-center">
                <span className="text-lg font-bold text-teal">Biddy</span>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-lg font-bold text-teal">Biddy</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-bold text-foreground">{item.title}</h3>
            {recommended && (
              <span className="shrink-0 rounded bg-teal-soft px-2 py-1 text-[10px] font-bold text-teal">
                추천
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-extrabold text-foreground">
            {Number(item.price).toLocaleString()}원
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            상태 {item.status} · 재고 {item.stock} · 판매자 #{item.sellerId}
          </p>
          {reason && <p className="mt-2 line-clamp-2 text-xs text-teal">{reason}</p>}
        </div>
      </div>
    </button>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [popularKeywords, setPopularKeywords] = useState([])
  const [historyKeywords, setHistoryKeywords] = useState([])
  const [historyProducts, setHistoryProducts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const hasResult = Boolean(searchParams.get("q"))

  const trimmedQuery = useMemo(() => query.trim(), [query])

  const runSearch = async (nextQuery = trimmedQuery) => {
    const keyword = nextQuery.trim()
    if (!keyword) return
    setLoading(true)
    setError(null)
    try {
      const data = await searchProducts({ query: keyword, size: 10 })
      setRecommendedProducts(data?.recommendedProducts || [])
      setProducts(data?.products || [])
      setSearchParams({ q: keyword })
    } catch (err) {
      setError(err.message)
      setRecommendedProducts([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadSearchHome = async () => {
      try {
        const popular = await fetchPopularKeywords({ size: 10 })
        setPopularKeywords(popular?.keywords || [])
      } catch {
        setPopularKeywords([])
      }

      if (!isAuthenticated) return
      try {
        const history = await fetchHistoryRecommendations({ size: 10 })
        setHistoryKeywords(history?.keywords || [])
        setHistoryProducts(history?.products || [])
      } catch {
        setHistoryKeywords([])
        setHistoryProducts([])
      }
    }

    loadSearchHome()
  }, [isAuthenticated])

  useEffect(() => {
    if (!initialQuery) return
    setQuery(initialQuery)
    runSearch(initialQuery)
  }, [])

  useEffect(() => {
    if (!trimmedQuery) {
      setSuggestions([])
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        const data = await fetchSearchSuggestions({ keyword: trimmedQuery, size: 10 })
        setSuggestions(data?.suggestions || [])
      } catch {
        setSuggestions([])
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [trimmedQuery])

  const submitKeyword = (keyword) => {
    const nextKeyword = keyword.trim()
    if (!nextKeyword) return
    setQuery(nextKeyword)
    runSearch(nextKeyword)
  }

  return (
    <PageContainer noPadX>
      <Header title="검색" showBack />

      <div className="px-4 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitKeyword(query)
          }}
          className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-border"
        >
          <Search size={20} className="shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="찾고 싶은 상품을 검색해보세요"
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-sm placeholder:font-medium placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setSuggestions([])
                navigate("/search", { replace: true })
              }}
              aria-label="검색어 지우기"
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
            >
              <X size={17} />
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white"
          >
            검색
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <KeywordButton key={suggestion} icon={Search} onClick={() => submitKeyword(suggestion)}>
                {suggestion}
              </KeywordButton>
            ))}
          </div>
        )}
      </div>

      {!hasResult && (
        <div className="space-y-6 px-4 pb-24 pt-5">
          {historyKeywords.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock size={18} className="text-teal" />
                <h2 className="text-base font-bold text-foreground">내 검색어 기반 추천</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {historyKeywords.map((item) => (
                  <KeywordButton
                    key={`${item.keyword}-${item.updatedAt || item.count}`}
                    onClick={() => submitKeyword(item.keyword)}
                  >
                    {item.keyword}
                  </KeywordButton>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-amber" />
              <h2 className="text-base font-bold text-foreground">인기검색어</h2>
            </div>
            {popularKeywords.length === 0 ? (
              <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-border">
                아직 인기검색어가 없습니다.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {popularKeywords.map((item) => (
                  <KeywordButton
                    key={`${item.keyword}-${item.count}`}
                    icon={TrendingUp}
                    onClick={() => submitKeyword(item.keyword)}
                  >
                    {item.keyword}
                  </KeywordButton>
                ))}
              </div>
            )}
          </section>

          {historyProducts.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-teal" />
                <h2 className="text-base font-bold text-foreground">추천 상품</h2>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {historyProducts.map((product) => (
                  <ProductResultCard key={normalizeProduct(product).id} product={product} recommended />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {hasResult && (
        <div className="space-y-6 px-4 pb-24 pt-5">
          {loading ? (
            <p className="rounded-xl bg-card p-5 text-center text-sm text-muted-foreground ring-1 ring-border">
              검색 중...
            </p>
          ) : error ? (
            <p className="rounded-xl bg-card p-5 text-center text-sm text-red-500 ring-1 ring-border">
              에러: {error}
            </p>
          ) : (
            <>
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-teal" />
                  <h2 className="text-base font-bold text-foreground">추천 상품</h2>
                </div>
                {recommendedProducts.length === 0 ? (
                  <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-border">
                    추천 상품이 없습니다.
                  </p>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {recommendedProducts.map((item, index) => (
                      <ProductResultCard
                        key={`${normalizeProduct(item.product).id}-recommended-${index}`}
                        product={item.product}
                        reason={item.reason}
                        recommended
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">검색 결과</h2>
                  <span className="text-xs font-semibold text-muted-foreground">{products.length}개</span>
                </div>
                {products.length === 0 ? (
                  <p className="rounded-xl bg-card p-5 text-center text-sm text-muted-foreground ring-1 ring-border">
                    검색 결과가 없습니다.
                  </p>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {products.map((product, index) => (
                      <ProductResultCard
                        key={`${normalizeProduct(product).id}-product-${index}`}
                        product={product}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </PageContainer>
  )
}
