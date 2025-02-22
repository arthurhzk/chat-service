import crypto from 'crypto';

export class Helpers {
  public static firstLetterUppercase(str: string): string {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  public static generateRandomIntegers(): string {
    const randomBytes = crypto.randomBytes(4);
    const randomInteger = randomBytes.readUInt32BE(0);
    return randomInteger.toString();
  }

  public static parseJson(prop: string): any {
    try {
      return JSON.parse(prop);
    } catch (error) {
      return prop;
    }
  }
}
