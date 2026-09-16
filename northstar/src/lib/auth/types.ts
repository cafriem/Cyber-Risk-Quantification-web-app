import type { Role } from "../validation/schemas";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      organizationId: string;
    };
  }

  interface User {
    role: Role;
    organizationId: string;
  }
}
