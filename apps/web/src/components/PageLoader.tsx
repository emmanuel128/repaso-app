export default function PageLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
