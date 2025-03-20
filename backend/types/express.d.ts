import { JwtPayload } from './userTypes';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {}; 