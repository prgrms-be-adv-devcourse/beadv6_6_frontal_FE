import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { LogIn } from "lucide-react"
import PageContainer from "../components/PageContainer"
import { Field, TextInput } from "../components/FormField"
import { useAuth } from "../contexts/AuthContext"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname || "/"
  const notice = location.state?.notice
  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <PageContainer className="flex flex-col">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center py-10">
        <div className="mb-8">
          <Link className="text-3xl font-extrabold tracking-tight text-teal" to="/">
            Biddy
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">믿고 거래하는 중고거래 &amp; 경매</p>
        </div>

        <div className="mb-6 flex gap-1.5 rounded-xl bg-muted p-1">
          <span className="flex-1 rounded-lg bg-teal py-2.5 text-center text-sm font-semibold text-teal-foreground">
            로그인
          </span>
          <Link
            to="/signup"
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-muted-foreground"
          >
            회원가입
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="이메일" required>
            <TextInput
              value={form.email}
              onChange={update("email")}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </Field>

          <Field label="비밀번호" required>
            <TextInput
              value={form.password}
              onChange={update("password")}
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              required
            />
          </Field>

          {notice && <p className="rounded-lg bg-teal-soft px-3 py-2 text-sm font-medium text-teal">{notice}</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
          >
            <LogIn size={18} />
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </main>
    </PageContainer>
  )
}
