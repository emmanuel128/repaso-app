import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout
      authorize={(access) => access.isAuthenticated && access.role === "owner"}
      areaLabel="Owner"
    >
      {children}
    </RoleGuardLayout>
  );
}
