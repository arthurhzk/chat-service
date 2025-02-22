import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { JoiValidation } from '@root/shared/decorators/joi-validation-decorator';
import { signupSchema } from '@auth/schemas/signup';
import { authService } from '@root/services/db/auth-service';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import HTTP_STATUS from 'http-status-codes';
import { IUserDocument } from '@auth/interfaces/user.interface';
import { UserCache } from '@root/services/redis/user.cache';
import { omit } from 'lodash';
import { authQueue } from '@root/services/queues/auth.queue';
import { userQueue } from '@root/services/queues/user.queue';
import JWT from 'jsonwebtoken';
import { config } from '@root/config';

const userCache: UserCache = new UserCache();
export class SignUp {
  @JoiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, password, email, avatarColor, avatarImage } = req.body;
    const checkIfUserExists: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExists) {
      throw new BadRequestError('Invalid credentials!');
    }
    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = Helpers.generateRandomIntegers();
    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      username,
      password,
      email,
      avatarColor,
      uId
    });
    const result: UploadApiResponse = (await uploads(avatarImage, userObjectId.toHexString(), true, true)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError('File upload failed!');
    }
    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);
    userDataForCache.profilePicture = `https://res.cloudinary.com/dyamr9ym3/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);
    omit(userDataForCache, ['uId', 'username', 'email', 'avatarColor', 'password']);
    authQueue.addAuthUserJob('addAuthUserToDB', { value: userDataForCache });
    userQueue.addUserJob('addUserToDB', { value: userDataForCache });
    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { jwt: userJwt };
    res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully!', user: userDataForCache, token: userJwt });
  }
  private signToken(data: IAuthDocument, userObjectId: ObjectId) {
    return JWT.sign(
      {
        _id: data._id,
        username: data.username,
        email: data.email,
        avatarColor: data.avatarColor,
        uId: data.uId,
        userObjectId
      },
      config.JWT_TOKEN!,
      { expiresIn: '1d' }
    );
  }
  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, password, email, avatarColor, uId } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      password,
      email: email.toLowerCase(),
      avatarColor,
      createdAt: new Date()
    } as unknown as IAuthDocument;
  }
  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }
}
