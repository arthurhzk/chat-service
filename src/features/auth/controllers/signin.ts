import { Request, Response } from 'express';
import { config } from '@root/config';
import JWT from 'jsonwebtoken';
import { JoiValidation } from '@root/shared/decorators/joi-validation-decorator';
import HTTP_STATUS from 'http-status-codes';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { IUserDocument } from '@auth/interfaces/user.interface';
import { loginSchema } from '@auth/schemas/signin';
import { authService } from '@root/services/db/auth-service';
import { mailTransport } from '@root/services/emails/email-transport';
import { forgotPasswordTemplate } from '@root/services/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@root/services/queues/email-queue';

export class SignIn {
  @JoiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    const userJwt: string = JWT.sign(
      {
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );
    req.session = { jwt: userJwt };
    const resetLink = `${config.CLIENT_URL}/reset-password/${userJwt}`;
    const template = forgotPasswordTemplate.passwordResetTemplate(existingUser.username!, resetLink);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: config.SENDER_EMAIL!, subject: 'Reset Password' });

    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: existingUser, token: userJwt });
  }
}
