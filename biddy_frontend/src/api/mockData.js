// Centralized mock data for the Biddy demo.
// Replace these with real API responses later.

const now = Date.now()
const hours = (h) => h * 60 * 60 * 1000

export const CATEGORIES = ["전체", "전자기기", "가구", "패션", "취미", "스포츠", "악기", "기타"]

export const products = [
  {
    id: "p1",
    type: "normal",
    title: "애플 에어팟 맥스 (거의 새것)",
    category: "전자기기",
    price: 480000,
    image: "/images/headphones.png",
    status: "거의 새것",
    stock: 1,
    liked: false,
    description:
      "구매 후 3개월 사용한 에어팟 맥스입니다. 생활기스 거의 없고 정품 박스, 케이블 모두 포함되어 있습니다. 직거래 및 택배 모두 가능합니다.",
    seller: { name: "사운드러버", rating: 4.9, deals: 37 },
  },
  {
    id: "p2",
    type: "auction",
    title: "빈티지 필름 카메라 (1980s)",
    category: "취미",
    image: "/images/camera.png",
    status: "중고",
    liked: true,
    description:
      "80년대 빈티지 필름 카메라입니다. 작동 완벽하게 확인했고 가죽 케이스 포함입니다. 컬렉터 분들께 추천드립니다.",
    seller: { name: "필름홀릭", rating: 4.7, deals: 12 },
    auction: {
      startPrice: 90000,
      currentBid: 135000,
      bidUnit: 5000,
      buyNowPrice: 250000,
      startAt: now - hours(20),
      endAt: now + hours(5),
      bidCount: 9,
    },
  },
  {
    id: "p3",
    type: "normal",
    title: "나이키 에어포스1 270mm",
    category: "패션",
    price: 79000,
    image: "/images/sneakers.png",
    status: "사용감 적음",
    stock: 1,
    liked: false,
    description: "270 사이즈 에어포스입니다. 5회 정도 착용했고 깨끗하게 보관했습니다.",
    seller: { name: "슈즈마켓", rating: 4.8, deals: 54 },
  },
  {
    id: "p4",
    type: "auction",
    title: "오메가 빈티지 손목시계",
    category: "패션",
    image: "/images/watch.png",
    status: "중고",
    liked: false,
    description:
      "정품 보증서 포함 오메가 빈티지 시계입니다. 최근 오버홀 완료했고 상태 매우 좋습니다. 경매로 좋은 주인 찾습니다.",
    seller: { name: "시계공방", rating: 5.0, deals: 8 },
    auction: {
      startPrice: 800000,
      currentBid: 1120000,
      bidUnit: 20000,
      buyNowPrice: null,
      startAt: now - hours(40),
      endAt: now + hours(1),
      bidCount: 21,
    },
  },
  {
    id: "p5",
    type: "normal",
    title: "닌텐도 스위치 OLED + 게임 2종",
    category: "전자기기",
    price: 295000,
    image: "/images/console.png",
    status: "거의 새것",
    stock: 1,
    liked: false,
    description: "OLED 모델이며 젤다, 마리오카트 패키지 포함입니다. 풀구성 박스 보관 상태 좋습니다.",
    seller: { name: "게임천국", rating: 4.6, deals: 23 },
  },
  {
    id: "p6",
    type: "auction",
    title: "어쿠스틱 기타 (입문용)",
    category: "악기",
    image: "/images/guitar.png",
    status: "중고",
    liked: false,
    description: "입문용 어쿠스틱 기타입니다. 넥 휨 없고 소리 좋습니다. 소프트케이스 포함입니다.",
    seller: { name: "기타사랑", rating: 4.5, deals: 6 },
    auction: {
      startPrice: 40000,
      currentBid: 58000,
      bidUnit: 2000,
      buyNowPrice: 120000,
      startAt: now - hours(10),
      endAt: now + hours(28),
      bidCount: 5,
    },
  },
  {
    id: "p7",
    type: "normal",
    title: "명품 레더 토트백",
    category: "패션",
    price: 620000,
    image: "/images/bag.png",
    status: "사용감 적음",
    stock: 1,
    liked: true,
    description: "정품 레더 토트백입니다. 더스트백, 보증카드 포함이며 사용감 적습니다.",
    seller: { name: "럭셔리클로젯", rating: 4.9, deals: 41 },
  },
  {
    id: "p8",
    type: "auction",
    title: "로드 자전거 (알루미늄 프레임)",
    category: "스포츠",
    image: "/images/bike.png",
    status: "중고",
    liked: false,
    description: "알루미늄 프레임 로드 자전거입니다. 변속 정비 완료했고 주행 거리 적습니다.",
    seller: { name: "라이딩데이", rating: 4.4, deals: 15 },
    auction: {
      startPrice: 150000,
      currentBid: 210000,
      bidUnit: 10000,
      buyNowPrice: 400000,
      startAt: now - hours(6),
      endAt: now + hours(50),
      bidCount: 7,
    },
  },
]

export const cartItems = [
  { id: "c1", productId: "p1", title: "애플 에어팟 맥스 (거의 새것)", price: 480000, image: "/images/headphones.png", qty: 1 },
  { id: "c2", productId: "p3", title: "나이키 에어포스1 270mm", price: 79000, image: "/images/sneakers.png", qty: 1 },
  { id: "c3", productId: "p5", title: "닌텐도 스위치 OLED + 게임 2종", price: 295000, image: "/images/console.png", qty: 1 },
]

export const orders = [
  {
    id: "o_20260620",
    title: "나이키 에어포스1 270mm",
    image: "/images/sneakers.png",
    amount: 79000,
    status: "delivered",
    createdAt: "2026-06-20 11:30",
  },
  {
    id: "o_20260618",
    title: "닌텐도 스위치 OLED + 게임 2종",
    image: "/images/console.png",
    amount: 295000,
    status: "shipping",
    createdAt: "2026-06-18 18:05",
  },
  {
    id: "o_20260612",
    title: "빈티지 필름 카메라 (1980s) 낙찰",
    image: "/images/camera.png",
    amount: 135000,
    status: "paid",
    createdAt: "2026-06-12 20:45",
  },
]

export const wallet = {
  balance: 530000,
  charges: [
    { id: "ch1", amount: 300000, method: "토스페이", date: "2026-06-21 14:22" },
    { id: "ch2", amount: 200000, method: "신용카드", date: "2026-06-18 09:10" },
    { id: "ch3", amount: 100000, method: "계좌이체", date: "2026-06-12 20:45" },
  ],
  payments: [
    { id: "pm1", title: "나이키 에어포스1 270mm", amount: 79000, date: "2026-06-20 11:30" },
    { id: "pm2", title: "빈티지 LP 레코드 5장", amount: 45000, date: "2026-06-15 16:02" },
  ],
}
