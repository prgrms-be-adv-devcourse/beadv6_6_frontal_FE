import { useEffect, useState } from "react"
import PageContainer from "../components/PageContainer"
import {
  getAllMembers,
  getPendingWithdrawals,
  approveWithdrawal,
  banMember,
  getMemberDeposit,
  adjustMemberDeposit,
} from "../api/adminApi"

const TABS = [
  { key: "withdrawals", label: "탈퇴 관리" },
  { key: "members", label: "회원 관리" },
]

export default function AdminPage() {
  const [tab, setTab] = useState("withdrawals")
  const [members, setMembers] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [deposits, setDeposits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [adjustingId, setAdjustingId] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustReason, setAdjustReason] = useState("")

  const loadDeposits = async (list) => {
    const results = await Promise.all(
      list.map((m) =>
        getMemberDeposit(m.id)
          .then((d) => [m.id, d?.balance ?? 0])
          .catch(() => [m.id, null]),
      ),
    )
    setDeposits(Object.fromEntries(results))
  }

  const loadMembers = () => {
    setLoading(true)
    setError("")
    getAllMembers()
      .then((list) => {
        setMembers(list)
        return loadDeposits(list)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const openAdjust = (memberId) => {
    setAdjustingId(memberId)
    setAdjustAmount("")
    setAdjustReason("")
  }

  const closeAdjust = () => {
    setAdjustingId(null)
    setAdjustAmount("")
    setAdjustReason("")
  }

  const handleAdjustSubmit = async (memberId) => {
    const amount = Number(adjustAmount)
    if (!amount) {
      alert("조정 금액을 입력해주세요. (양수: 충전, 음수: 차감)")
      return
    }
    if (!adjustReason.trim()) {
      alert("조정 사유를 입력해주세요.")
      return
    }
    try {
      const result = await adjustMemberDeposit(memberId, { amount, reason: adjustReason.trim() })
      setDeposits((prev) => ({ ...prev, [memberId]: result?.balance ?? prev[memberId] }))
      closeAdjust()
    } catch (err) {
      alert(err.message)
    }
  }

  const loadWithdrawals = () => {
    setLoading(true)
    setError("")
    getPendingWithdrawals()
      .then(setWithdrawals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === "withdrawals") loadWithdrawals()
    else loadMembers()
  }, [tab])

  const handleApprove = async (memberId) => {
    if (!window.confirm("탈퇴를 승인하시겠습니까?")) return
    try {
      await approveWithdrawal(memberId)
      loadWithdrawals()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBan = async (memberId) => {
    if (!window.confirm("이 회원을 추방하시겠습니까?")) return
    try {
      await banMember(memberId)
      loadMembers()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <PageContainer className="flex flex-col gap-5 py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header>
        <span className="mb-1 inline-block rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
          ADMIN
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">관리자 페이지</h1>
      </header>

      <div className="flex gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              tab === t.key ? "bg-teal text-teal-foreground" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

      {!loading && tab === "withdrawals" && (
        <div className="flex flex-col gap-2">
          {withdrawals.length === 0 && <p className="text-sm text-muted-foreground">대기 중인 탈퇴 요청이 없습니다.</p>}
          {withdrawals.map((w) => (
            <div key={w.memberId} className="flex items-center justify-between rounded-xl bg-card p-3 ring-1 ring-border">
              <div>
                <p className="text-sm font-semibold text-foreground">회원 ID: {w.memberId}</p>
                <p className="text-xs text-muted-foreground">
                  요청일: {w.requestedAt ? new Date(w.requestedAt).toLocaleString() : "-"}
                </p>
              </div>
              <button
                onClick={() => handleApprove(w.memberId)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                승인
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "members" && (
        <div className="flex flex-col gap-2">
          {members.length === 0 && <p className="text-sm text-muted-foreground">회원이 없습니다.</p>}
          {members.map((m) => (
            <div key={m.id} className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{m.nickname}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                  <p className="mt-1 text-xs font-semibold text-teal-700">
                    예치금:{" "}
                    {deposits[m.id] == null ? "조회 불가" : `${deposits[m.id].toLocaleString()}원`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => (adjustingId === m.id ? closeAdjust() : openAdjust(m.id))}
                    className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200"
                  >
                    {adjustingId === m.id ? "취소" : "예치금 조정"}
                  </button>
                  <button
                    onClick={() => handleBan(m.id)}
                    className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200"
                  >
                    추방
                  </button>
                </div>
              </div>

              {adjustingId === m.id && (
                <div className="flex flex-col gap-2 rounded-lg bg-background p-3 ring-1 ring-border">
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="조정 금액 (양수: 충전, 음수: 차감)"
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="조정 사유"
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => handleAdjustSubmit(m.id)}
                    className="rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-teal-foreground"
                  >
                    적용
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </PageContainer>
  )
}