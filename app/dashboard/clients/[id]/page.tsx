export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <h1 className="text-2xl font-bold">Panel de Información de la Empresa</h1>
      <p className="text-muted-foreground">
        En construcción. ID del Cliente: <span className="font-mono">{id}</span>
      </p>
    </div>
  );
}
