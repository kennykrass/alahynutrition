export default async function DashboardPage() {
  const { redirect } = await import("next/navigation");
  const { getPostLoginPath, requireUser } = await import("@/lib/session");
  const session = await requireUser();

  redirect(getPostLoginPath(session));
}
