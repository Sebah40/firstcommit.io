export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <span className="text-3xl">👤</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">User not found</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        The profile you&apos;re looking for doesn&apos;t exist.
      </p>
    </div>
  );
}
