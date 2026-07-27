import { apiRequest } from "./client"

export const PAYMENT_METHOD = {
  WALLET: "WALLET",
  NORMAL: "NORMAL",
}

export function confirmPayment(payload) {
  return createPayment(payload)
}

function createIdempotencyKey({ orderId, amount, paymentMethod, tossOrderId, pgTransactionId }) {
  if (tossOrderId) return `payment:${tossOrderId}`
  if (pgTransactionId) return `payment:${pgTransactionId}`
  if (orderId && amount && paymentMethod) return `payment:${orderId}:${paymentMethod}:${amount}`

  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `payment:${crypto.randomUUID()}`
  }

  return `payment:${Date.now()}:${Math.random().toString(36).slice(2)}`
}

const TRANSACTION_LABELS = {
  CHARGE: "예치금 충전",
  WITHDRAW: "예치금 출금",
  PAYMENT: "예치금 결제",
  CANCEL: "결제 취소",
  REFUND: "환불",
  SETTLEMENT: "정산 지급",
  ADJUSTMENT: "예치금 조정",
}
function unwrapApiResponse(response) {
  if (response && typeof response === "object" && "success" in response) {
    if (!response.success) {
      throw new Error(response.message || "요청 처리 중 오류가 발생했습니다.")
    }
    return response.data
  }

  return response
}

function mapTransaction(transaction) {
  const amount = Number(transaction.amount || 0)

  return {
    id: transaction.id,
    type: transaction.type,
    title: TRANSACTION_LABELS[transaction.type] || transaction.reason || "예치금 거래",
    amount: Math.abs(amount),
    signedAmount: amount,
    balanceAfter: transaction.balanceAfter,
    reason: transaction.reason,
    referenceType: transaction.referenceType,
    referenceId: transaction.referenceId,
    createdAt: transaction.createdAt,
    kind: amount >= 0 ? "in" : "out",
  }
}

export async function fetchDepositBalance() {
  return unwrapApiResponse(await apiRequest("/payments/deposits/balance"))
}

export async function fetchDepositTransactions() {
  const transactions = unwrapApiResponse(await apiRequest("/payments/deposits/transactions"))
  return Array.isArray(transactions) ? transactions.map(mapTransaction) : []
}

export async function fetchWallet() {
  const [balance, transactions] = await Promise.all([fetchDepositBalance(), fetchDepositTransactions()])

  return {
    userId: balance?.userId,
    balance: balance?.balance ?? 0,
    updatedAt: balance?.updatedAt,
    transactions,
  }
}

export async function chargeDeposit({ amount, paymentKey, orderId }) {
  return unwrapApiResponse(
    await apiRequest("/payments/deposits/charge", {
      method: "POST",
      body: {
        amount,
        paymentKey,
        orderId,
      },
    }),
  )
}

export async function createPayment({
  orderId,
  amount,
  paymentMethod = PAYMENT_METHOD.WALLET,
  paymentKey,
  tossOrderId,
  pgTransactionId,
  idempotencyKey,
}) {
  const resolvedIdempotencyKey =
    idempotencyKey ||
    createIdempotencyKey({ orderId, amount, paymentMethod, tossOrderId, pgTransactionId })

  return unwrapApiResponse(
    await apiRequest("/payments", {
      method: "POST",
      headers: {
        "Idempotency-Key": resolvedIdempotencyKey,
      },
      body: {
        orderId,
        amount,
        paymentMethod,
        ...(paymentKey ? { paymentKey } : {}),
        ...(tossOrderId ? { tossOrderId } : {}),
        ...(pgTransactionId ? { pgTransactionId } : {}),
      },
    }),
  )
}

export function pay(payment) {
  return createPayment(payment)
}

export async function fetchPayment(paymentId) {
  return unwrapApiResponse(await apiRequest(`/payments/${paymentId}`))
}

async function changePayment(paymentId, action, { amount, reason }) {
  return unwrapApiResponse(
    await apiRequest(`/payments/${paymentId}/${action}`, {
      method: "POST",
      body: {
        amount,
        reason,
      },
    }),
  )
}

export function cancelPayment(paymentId, payload) {
  return changePayment(paymentId, "cancel", payload)
}

export function refundPayment(paymentId, payload) {
  return changePayment(paymentId, "refund", payload)
}
