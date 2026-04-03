import { canEnterAdminArea } from "@repaso/domain";
import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout authorize={canEnterAdminArea} areaLabel="Admin">
      {children}
    </RoleGuardLayout>
  );
}
