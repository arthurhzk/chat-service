import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordTemplate {
  public passwordResetTemplate(username: string, resetLink: string): string {
    return ejs.render(fs.readFileSync(__dirname + '/forgot-password-template.ejs', 'utf8'), {
      username,
      resetLink,
      image_url:
        'https://media.gettyimages.com/id/2096367698/pt/vetorial/password-detailed-icon-password-lock-symbol-padlock-logo-check-secure-password-icon.jpg?s=612x612&w=gi&k=20&c=4ciYVUa0JLdIgFjfxc1utKk6VsZE3wLzvvAA24bhhdQ='
    });
  }
}
export const forgotPasswordTemplate: ForgotPasswordTemplate = new ForgotPasswordTemplate();
