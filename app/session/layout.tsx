export default function SessionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {children}
    </div>
  )
}
