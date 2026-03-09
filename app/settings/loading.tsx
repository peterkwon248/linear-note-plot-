export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-secondary" />
      <div className="space-y-3">
        <div className="h-4 w-full max-w-[300px] rounded bg-secondary" />
        <div className="h-10 w-full max-w-[400px] rounded bg-secondary" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full max-w-[250px] rounded bg-secondary" />
        <div className="h-10 w-full max-w-[400px] rounded bg-secondary" />
      </div>
    </div>
  )
}
