import { AuthenticatedUser } from './inteerficeAuthCreateUser';

export interface RequestWithUser {
  user?: AuthenticatedUser;
}
