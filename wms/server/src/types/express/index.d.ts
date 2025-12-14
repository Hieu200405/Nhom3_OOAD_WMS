import type { UserRole } from '@wms/shared';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      fullName: string;
      role: UserRole;
    }

    interface Request {
      user?: User;
      authToken?: string;
    }
  }
}

export {};
