import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout allowedRoles={["admin"]} areaLabel="Admin">
      {children}
    </RoleGuardLayout>
  );
}
