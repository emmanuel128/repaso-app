export default function AccessNotice({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-foreground/10 p-8">
        <h1 className="text-2xl font-semibold text-foreground mb-3">{title}</h1>
        <p className="text-text-secondary leading-7">{message}</p>
      </div>
    </div>
  );
}
