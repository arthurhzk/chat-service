import { IUserDocument } from '@auth/interfaces/user.interface';
import { userService } from '@root/services/db/user-service';
import { userCache } from '@root/services/redis/user.cache';
import { Request, Response } from 'express';

export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;

    const cacheUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;
    const existingUser = cacheUser ? cacheUser : await userService.getUserById(req.currentUser!.userId);
    if (Object.keys(existingUser).length > 0) {
      isUser = true;
      token = req.session?.jwt;
      user = existingUser;
    }

    res.status(200).json({ isUser, token, user });
  }
}
