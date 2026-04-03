import RoleGuardLayout from "@/components/RoleGuardLayout";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuardLayout allowedRoles={["owner"]} areaLabel="Owner">
      {children}
    </RoleGuardLayout>
  );
}
