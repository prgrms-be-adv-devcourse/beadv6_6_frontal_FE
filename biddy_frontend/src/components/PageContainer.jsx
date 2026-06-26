// Shared outer page frame. Every page uses the same desktop web-page width
// (matches the Header's max-w-6xl) so the whole site has one common layout
// basis. Pages that need a narrower, form-like reading width (login, cart,
// checkout, etc.) wrap their own content in an inner `mx-auto max-w-md` (or
// similar) div instead of changing this shared frame.
const COMMON_WIDTH = "max-w-6xl"

export default function PageContainer({ children, className = "", noPadX = false }) {
  return (
    <div className="min-h-full bg-background flex justify-center">
      <div
        className={`w-full ${COMMON_WIDTH} bg-background min-h-screen pb-10 ${
          noPadX ? "" : "px-4"
        } ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
