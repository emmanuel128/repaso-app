import RoleGuardLayout from "@/components/RoleGuardLayout";
import { canAccessAdminArea } from "@/lib/role-authorization";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout
      authorize={canAccessAdminArea}
      areaLabel="Admin"
    >
      {children}
    </RoleGuardLayout>
  );
}
