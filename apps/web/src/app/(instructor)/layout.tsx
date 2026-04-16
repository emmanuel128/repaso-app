import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function InstructorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout area="instructor" areaLabel="Instructor">
      {children}
    </RoleGuardLayout>
  );
}
