import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout
      authorize={(access) => access.isAuthenticated && access.role === "admin"}
      areaLabel="Admin"
    >
      {children}
    </RoleGuardLayout>
  );
}
