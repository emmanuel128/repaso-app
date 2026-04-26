import { redirect } from "next/navigation";

export default async function PracticeSummaryRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/student/topics/${slug}/practice/summary`);
}
