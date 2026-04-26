import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout area="admin" areaLabel="Admin">
      {children}
    </RoleGuardLayout>
  );
}
