import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AuthUser, MembershipInfo } from '../../src/types/auth.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        user: AuthUser;
        firebase: DecodedIdToken;
        isPlatformAdmin: boolean;
      };
      membership?: MembershipInfo;
      tenantId?: string;
    }
  }
}

export {};
