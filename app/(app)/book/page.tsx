import { redirect } from "next/navigation"

// Phase 1B-3: /book is an alias for /wiki during the Book Pivot transition.
// Phase 1C will flip this — /wiki will redirect to /book (new canonical URL).
export default function BookPage() {
  redirect("/wiki")
}
