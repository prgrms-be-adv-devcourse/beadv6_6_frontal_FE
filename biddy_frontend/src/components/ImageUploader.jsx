import { useState } from "react"
import { ImagePlus, X } from "lucide-react"

export default function ImageUploader({ max = 5, onFilesChange }) {
  const [previews, setPreviews] = useState([])
  const [files, setFiles] = useState([])

  const onPick = (e) => {
    const picked = Array.from(e.target.files || [])
    const newFiles = [...files, ...picked].slice(0, max)
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setFiles(newFiles)
    setPreviews(newPreviews)
    onFilesChange?.(newFiles)
  }

  const remove = (i) => {
    const newFiles = files.filter((_, idx) => idx !== i)
    const newPreviews = previews.filter((_, idx) => idx !== i)
    setFiles(newFiles)
    setPreviews(newPreviews)
    onFilesChange?.(newFiles)
  }

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto p-1 -m-1">
      <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-card text-muted-foreground ring-1 ring-border">
        <ImagePlus size={22} />
        <span className="text-xs font-medium">{previews.length}/{max}</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      </label>
      {previews.map((src, i) => (
        <div key={i} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
          <img src={src} alt={`업로드 이미지 ${i + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-dark/80 text-dark-foreground"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
