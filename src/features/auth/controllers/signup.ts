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
    res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully!' });
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
}
