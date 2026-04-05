import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function InstructorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout
      authorize={(access) => access.isAuthenticated && access.role === "instructor"}
      areaLabel="Instructor"
    >
      {children}
    </RoleGuardLayout>
  );
}
