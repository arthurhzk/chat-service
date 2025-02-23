import fs from 'fs';
import ejs from 'ejs';
import { IResetPasswordParams } from '@auth/interfaces/user.interface';

class ResetPasswordTemplate {
  public passwordResetTemplate(templateParams: IResetPasswordParams): string {
    const { username, ipaddress, date, email } = templateParams;
    return ejs.render(fs.readFileSync(__dirname + '/reset-password-template.ejs', 'utf8'), {
      username,
      ipaddress,
      email,
      date,
      image_url:
        'https://media.gettyimages.com/id/2096367698/pt/vetorial/password-detailed-icon-password-lock-symbol-padlock-logo-check-secure-password-icon.jpg?s=612x612&w=gi&k=20&c=4ciYVUa0JLdIgFjfxc1utKk6VsZE3wLzvvAA24bhhdQ='
    });
  }
}
export const resetPasswordTemplate: ResetPasswordTemplate = new ResetPasswordTemplate();
