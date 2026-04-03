import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function InstructorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout allowedRoles={["instructor"]} areaLabel="Instructor">
      {children}
    </RoleGuardLayout>
  );
}
