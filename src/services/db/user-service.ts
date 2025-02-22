import { IUserDocument } from '@auth/interfaces/user.interface';
import { UserModel } from '@auth/models/user.schema';

class UserService {
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data);
  }
}

export const userService: UserService = new UserService();
