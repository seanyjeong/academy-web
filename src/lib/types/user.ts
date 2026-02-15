export type UserRole = "owner" | "admin" | "staff" | "teacher";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  academy_id: number;
  permissions: Record<string, Record<string, boolean>> | null;
  modules?: string[];
}

export interface Academy {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  modules: string[];
  organization_id?: number;
}
