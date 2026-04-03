import { canEnterInstructorArea } from "@repaso/domain";
import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function InstructorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout authorize={canEnterInstructorArea} areaLabel="Instructor">
      {children}
    </RoleGuardLayout>
  );
}
