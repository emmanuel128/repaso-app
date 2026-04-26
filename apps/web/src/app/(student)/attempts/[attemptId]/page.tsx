import { redirect } from "next/navigation";

export default async function AttemptRedirectPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  redirect(`/student/attempts/${attemptId}`);
}
