import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.schema';
import { Helpers } from '@global/helpers/helpers';
class AuthService {
  public async createAuthUser(user: IAuthDocument): Promise<IAuthDocument> {
    const newUser = await AuthModel.create(user);
    return newUser;
  }
  public async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    const query = { $or: [{ username: Helpers.firstLetterUppercase(username) }, { email: email.toLowerCase() }] };
    const user = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }
}

export const authService = new AuthService();
