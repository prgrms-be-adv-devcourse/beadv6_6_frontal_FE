import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut, UserX } from "lucide-react"
import { Field, TextInput } from "../components/FormField"
import { useAuth } from "../contexts/AuthContext"
import { getMyInfo, updateNickname, updatePassword, withdrawMember } from "../api/memberApi"

// Rendered as the index section inside MyPageLayout's sidebar (no own Header/PageContainer).
export default function MyPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [nickname, setNickname] = useState("")
  const [nicknameMsg, setNicknameMsg] = useState("")
  const [nicknameSubmitting, setNicknameSubmitting] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" })
  const [passwordMsg, setPasswordMsg] = useState("")
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  useEffect(() => {
    getMyInfo()
      .then((data) => {
        setInfo(data)
        setNickname(data.nickname || "")
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleNicknameSubmit = async (e) => {
    e.preventDefault()
    setNicknameMsg("")
    setNicknameSubmitting(true)
    try {
      await updateNickname(nickname)
      setNicknameMsg("닉네임이 변경되었습니다.")
    } catch (err) {
      setNicknameMsg(err.message)
    } finally {
      setNicknameSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMsg("")
    setPasswordSubmitting(true)
    try {
      await updatePassword(passwordForm)
      setPasswordMsg("비밀번호가 변경되었습니다.")
      setPasswordForm({ currentPassword: "", newPassword: "" })
    } catch (err) {
      setPasswordMsg(err.message)
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 탈퇴는 관리자 승인 후 처리됩니다.")) return
    try {
      await withdrawMember()
      await logout()
      navigate("/login", { replace: true })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-xl font-extrabold text-foreground">내 정보</h1>

      {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}

      {info && (
        <section className="rounded-xl bg-card p-4 ring-1 ring-border">
          <p className="text-sm text-muted-foreground">이메일</p>
          <p className="font-semibold text-foreground">{info.email}</p>
        </section>
      )}

      <form onSubmit={handleNicknameSubmit} className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-foreground">닉네임 변경</h2>
        <Field label="닉네임">
          <TextInput value={nickname} onChange={(e) => setNickname(e.target.value)} minLength={2} maxLength={50} required />
        </Field>
        {nicknameMsg && <p className="text-sm font-medium text-teal">{nicknameMsg}</p>}
        <button
          type="submit"
          disabled={nicknameSubmitting}
          className="h-11 rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
        >
          {nicknameSubmitting ? "변경 중..." : "닉네임 변경"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-foreground">비밀번호 변경</h2>
        <Field label="현재 비밀번호">
          <TextInput
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
            required
          />
        </Field>
        <Field label="새 비밀번호" hint="8자 이상">
          <TextInput
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
            minLength={8}
            required
          />
        </Field>
        {passwordMsg && <p className="text-sm font-medium text-teal">{passwordMsg}</p>}
        <button
          type="submit"
          disabled={passwordSubmitting}
          className="h-11 rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
        >
          {passwordSubmitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      <div className="mt-2 flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-card font-semibold text-foreground ring-1 ring-border"
        >
          <LogOut size={16} /> 로그아웃
        </button>
        <button
          onClick={handleWithdraw}
          className="flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-600"
        >
          <UserX size={16} /> 회원 탈퇴
        </button>
      </div>
    </div>
  )
}