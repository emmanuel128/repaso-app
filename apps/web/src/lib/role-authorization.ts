import { Access as DomainAccess, type Shared as DomainShared } from "@repaso/domain";

export function canAccessAdminArea(access: DomainShared.CurrentAccess) {
  return DomainAccess.canEnterAdminArea(access);
}

export function canAccessInstructorArea(access: DomainShared.CurrentAccess) {
  return DomainAccess.canEnterInstructorArea(access);
}

export function canAccessOwnerArea(access: DomainShared.CurrentAccess) {
  return DomainAccess.canEnterOwnerArea(access);
}
