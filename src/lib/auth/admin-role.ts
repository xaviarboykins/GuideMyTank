export type AdminRoleSubject = {
  app_metadata?: Record<string, unknown> | null;
};

export function hasAdminRole(subject: AdminRoleSubject | null | undefined) {
  return subject?.app_metadata?.role === "admin";
}
