import RoleGuardLayout from "@/components/RoleGuardLayout";
import { canAccessInstructorArea } from "@/lib/role-authorization";

export default function InstructorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout
      authorize={canAccessInstructorArea}
      areaLabel="Instructor"
    >
      {children}
    </RoleGuardLayout>
  );
}
