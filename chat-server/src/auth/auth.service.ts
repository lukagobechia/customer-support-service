import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { EmailSenderService } from 'src/email-sender/email-sender.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schema/user.schema';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private jwtService: JwtService,
    private readonly emailSernderService: EmailSenderService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const existUser = await this.usersService.findOneByEmail(signUpDto.email);
    if (existUser)
      throw new BadRequestException('User with that email already exist');

    const hashedPassword = await argon2.hash(signUpDto.password);

    const { otpCode, validateOtpCodeDate } = this.genereteOtp();

    const newUser = await this.userModel.create({
      ...signUpDto,
      password: hashedPassword,
      otpCode,
      validateOtpCodeDate,
    });

    await this.emailSernderService.sendActivationEmail(newUser, otpCode);

    return { message: 'Verify account' };
  }

  async verifyEmail(email: string, otpCode: string) {
    const existUser = await this.usersService.findOneByEmail(email);

    if (!existUser)
      throw new BadRequestException('User with that email does not exist');

    if (existUser.isVerified)
      throw new BadRequestException('User is already verified');

    if (otpCode.length > 6 || otpCode.length < 6)
      throw new BadRequestException('Code must be 6 digits');

    if (otpCode !== existUser.otpCode)
      throw new BadRequestException('Wrong OTP code');

    if (
      !existUser.validateOtpCodeDate ||
      existUser.validateOtpCodeDate < new Date()
    )
      throw new BadRequestException('OTP code is expired');

    await this.userModel.findByIdAndUpdate(existUser._id, {
      $set: { isVerified: true, otpCode: null, validateOtpCodeDate: null },
    });

    const payload = {
      userId: existUser._id,
      userEmail: existUser.email,
      status: existUser.isVerified,
    };

    const accsessToken = this.jwtService.sign(payload, { expiresIn: '3h' });

    return {
      message: 'Verified successfully',
      accsessToken,
    };
  }

  async resendVerificationCodeToEmail(email: string) {
    const existUser = await this.usersService.findOneByEmail(email);

    if (!existUser)
      throw new BadRequestException('User with that email does not exist');

    if (existUser.isVerified)
      throw new BadRequestException('User is already verified');

    const { otpCode, validateOtpCodeDate } = this.genereteOtp();

    await this.userModel.findByIdAndUpdate(existUser._id, {
      $set: { otpCode, validateOtpCodeDate },
    });

    await this.emailSernderService.sendActivationEmail(existUser, otpCode);

    return { message: 'OTP code is resent' };
  }

  genereteOtp() {
    const otpCode = Math.random().toString().slice(2, 8);

    const validateOtpCodeDate = new Date();
    validateOtpCodeDate.setTime(validateOtpCodeDate.getTime() + 3 * 60 * 1000);

    return { otpCode, validateOtpCodeDate };
  }

  async signIn(signInDto: SignInDto) {
    const existUser = await this.usersService.findOneByEmail(signInDto.email);

    if (!existUser) throw new BadRequestException('User doesnot exist');

    const passMatch = argon2.verify(existUser.password, signInDto.password);
    if (!passMatch)
      throw new UnauthorizedException('Password or email is incorrect');

    if (!existUser.isVerified)
      throw new UnauthorizedException(
        'Account is not active. Activation email is sent successfully.',
      );

    const payload = {
      userId: existUser._id,
      userEmail: existUser.email,
      status: existUser.isVerified,
      role: existUser.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '3h' });

    return { accessToken };
  }

  async requestResetPassword(email: string) {
    const existUser = await this.usersService.findOneByEmail(email);

    if (!existUser) throw new BadRequestException('User Not Found');

    const payload = {
      userId: existUser._id,
      userEmail: existUser.email,
      status: existUser.isVerified,
    };

    const resetToken = this.jwtService.sign(payload, { expiresIn: '3m' });

    await this.emailSernderService.sendResetPasswordEmail(
      existUser,
      resetToken,
    );
    return { message: 'Reset password link sent to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, repeatPassword, token } = resetPasswordDto;

    if (!password || !repeatPassword) {
      throw new BadRequestException('Password fields cannot be empty');
    }

    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findOneByEmail(payload.userEmail);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (password !== repeatPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const isSamePassword = await argon2.verify(user.password, password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as the previous password',
      );
    }

    const hashedPassword = await argon2.hash(password);

    await this.userModel.findByIdAndUpdate(payload.userId, {
      $set: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  async getCurrentUser(id: string) {
    return await this.usersService.findOne(id);
  }
}
