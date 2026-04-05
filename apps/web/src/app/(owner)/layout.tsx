import RoleGuardLayout from "@/components/RoleGuardLayout";
import { canAccessOwnerArea } from "@/lib/role-authorization";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout
      authorize={canAccessOwnerArea}
      areaLabel="Owner"
    >
      {children}
    </RoleGuardLayout>
  );
}
