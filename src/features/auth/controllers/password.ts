import { Request, Response } from 'express';
import { config } from '@root/config';
import { authService } from '@root/services/db/auth-service';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { JoiValidation } from '@root/shared/decorators/joi-validation-decorator';
import { emailSchema, passwordSchema } from '@auth/schemas/password';
import crypto from 'crypto';
import { forgotPasswordTemplate } from '@root/services/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@root/services/queues/email-queue';
import { StatusCodes } from 'http-status-codes';
import { IResetPasswordParams } from '@auth/interfaces/user.interface';
import moment from 'moment';
import { resetPasswordTemplate } from '@root/services/emails/templates/reset-password/reset-password-template';
import publicIP from 'ip';

export class Password {
  @JoiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const existingUser: IAuthDocument = await authService.getAuthUserByEmail(email);

    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(32));
    const randomCharacters: string = randomBytes.toString('hex');
    await authService.updatePasswordToken(`${existingUser._id!}`, randomCharacters, Date.now() + 3600000);
    const resetLink = `${config.CLIENT_URL}/reset-password/${randomCharacters}`;
    const template: string = forgotPasswordTemplate.passwordResetTemplate(existingUser.username!, resetLink);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: existingUser.email!, subject: 'Reset your Password' });
    res.status(StatusCodes.OK).json({ message: 'Password reset link sent to your email' });
  }
  @JoiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }
    const existingUser: IAuthDocument = await authService.getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Reset token has expired.');
    }

    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;
    await existingUser.save();

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    };
    const template: string = resetPasswordTemplate.passwordResetTemplate(templateParams);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: existingUser.email!, subject: 'Password Reset Confirmation' });
    res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
  }
}
