import { redirect } from "next/navigation";

export default async function PracticeRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/student/topics/${slug}/practice`);
}
