import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { UserPlus, Mail, CheckCircle2 } from "lucide-react"
import PageContainer from "../components/PageContainer"
import { Field, TextInput } from "../components/FormField"
import { useAuth } from "../contexts/AuthContext"
import { sendVerificationEmail, verifyEmail } from "../api/authApi"

export default function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, signup } = useAuth()
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    phone: "",
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // 이메일 인증 상태
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [verificationToken, setVerificationToken] = useState("")
  const [emailSending, setEmailSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [emailMsg, setEmailMsg] = useState("")

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSendVerification = async () => {
    if (!form.email) {
      setEmailMsg("이메일을 먼저 입력해 주세요.")
      return
    }
    setEmailMsg("")
    setEmailSending(true)
    try {
      await sendVerificationEmail(form.email)
      setEmailSent(true)
      setEmailMsg("인증 코드를 전송했습니다. 이메일을 확인해 주세요.")
    } catch (err) {
      setEmailMsg(err.message)
    } finally {
      setEmailSending(false)
    }
  }

  const handleVerifyToken = async () => {
    if (!verificationToken) {
      setEmailMsg("인증 코드를 입력해 주세요.")
      return
    }
    setEmailMsg("")
    setVerifying(true)
    try {
      await verifyEmail({ email: form.email, token: verificationToken })
      setEmailVerified(true)
      setEmailMsg("이메일 인증이 완료되었습니다.")
    } catch (err) {
      setEmailMsg(err.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!emailVerified) {
      setError("이메일 인증을 먼저 완료해 주세요.")
      return
    }

    const normalizedPhone = form.phone.replaceAll("-", "")
    if (!normalizedPhone) {
      setError("전화번호를 입력해 주세요.")
      return
    }

    setSubmitting(true)
    try {
      await signup({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        phone: normalizedPhone,
      })
      navigate("/login", {
        replace: true,
        state: { notice: "회원가입이 완료되었습니다. 로그인해 주세요." },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/products" replace />
  }

  return (
    <PageContainer className="flex flex-col">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center py-10">
        <div className="mb-8">
          <Link className="text-3xl font-extrabold tracking-tight text-teal" to="/">
            Biddy
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">거래에 사용할 기본 정보를 입력해 주세요.</p>
        </div>

        <div className="mb-6 flex gap-1.5 rounded-xl bg-muted p-1">
          <Link
            to="/login"
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-muted-foreground"
          >
            로그인
          </Link>
          <span className="flex-1 rounded-lg bg-teal py-2.5 text-center text-sm font-semibold text-teal-foreground">
            회원가입
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="이메일" required>
            <div className="flex flex-col gap-2 min-[420px]:flex-row">
              <TextInput
                value={form.email}
                onChange={(e) => {
                  update("email")(e)
                  setEmailVerified(false)
                  setEmailSent(false)
                  setEmailMsg("")
                }}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={emailVerified}
                required
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={emailSending || emailVerified}
                className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-xl bg-card px-3 text-sm font-semibold text-teal ring-1 ring-border disabled:opacity-50"
              >
                <Mail size={14} />
                {emailVerified ? "인증완료" : emailSending ? "전송 중..." : emailSent ? "재전송" : "인증코드 받기"}
              </button>
            </div>
          </Field>

          {emailSent && !emailVerified && (
            <Field label="인증 코드" required>
              <div className="flex flex-col gap-2 min-[420px]:flex-row">
                <TextInput
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="이메일로 받은 인증 코드"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={handleVerifyToken}
                  disabled={verifying}
                  className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-xl bg-teal px-3 text-sm font-semibold text-teal-foreground disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  {verifying ? "확인 중..." : "확인"}
                </button>
              </div>
            </Field>
          )}

          {emailMsg && (
            <p className={`text-sm font-medium ${emailVerified ? "text-teal" : "text-muted-foreground"}`}>
              {emailMsg}
            </p>
          )}

          <Field label="비밀번호" required hint="8자 이상">
            <TextInput
              value={form.password}
              onChange={update("password")}
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호"
              minLength={8}
              required
            />
          </Field>

          <Field label="닉네임" required>
            <TextInput
              value={form.nickname}
              onChange={update("nickname")}
              autoComplete="nickname"
              placeholder="2자 이상"
              minLength={2}
              maxLength={50}
              required
            />
          </Field>

          <Field label="전화번호" required hint="숫자만 입력 가능">
            <TextInput
              value={form.phone}
              onChange={update("phone")}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="01012345678"
              pattern="\d{10,11}"
              required
            />
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !emailVerified}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
          >
            <UserPlus size={18} />
            {submitting ? "가입 중..." : "회원가입"}
          </button>
        </form>
      </main>
    </PageContainer>
  )
}
