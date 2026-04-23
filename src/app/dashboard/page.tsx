export default async function DashboardPage() {
  const { redirect } = await import("next/navigation");
  const { getDefaultDashboardPath, requireUser } = await import("@/lib/session");
  const session = await requireUser();

  redirect(getDefaultDashboardPath(session.role));
}
