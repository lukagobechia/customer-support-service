import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { VeridyEmailDto } from "./dto/verify-email.dto";
import { RequestResetPasswordDto } from "./dto/request-reset-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtService } from "@nestjs/jwt";
import * as jwt from "jsonwebtoken";
import { AuthGuard } from "./auth.guard";
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService
  ) {}

  @Post("sign-up")
  signUp(@Body() signupDto: SignUpDto) {
    return this.authService.signUp(signupDto);
  }

  @Post("sign-in")
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post("verify-email")
  verifyEmail(@Body() { email, otpCode }: VeridyEmailDto) {
    return this.authService.verifyEmail(email, otpCode);
  }

  @Post("resend-verify-email")
  resendVerificationCodeToEmail(@Body() { email }: { email: string }) {
    return this.authService.resendVerificationCodeToEmail(email);
  }

  @Post("request-reset-password")
  requestResetPassword(
    @Body() requestResetPasswordDto: RequestResetPasswordDto
  ) {
    return this.authService.requestResetPassword(requestResetPasswordDto.email);
  }

  @Post("reset-password")
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get("reset-password")
  async renderResetPasswordPage(@Query("token") token: string, @Res() res) {
    try {
      const payload = this.jwtService.verify(token);
      return res.render("reset-password", { token });
    } catch (error) {
      let message;
      if (error instanceof jwt.TokenExpiredError) {
        message = "Link has expired";
        return res.render("token-expired", { message });
      }
      message = error;
      return res.render("token-expired", { message });
    }
  }

  @Get("current-user")
  @UseGuards(AuthGuard)
  getCurrentUser(@Req() req) {
    const id = req.user.userId;
    return this.authService.getCurrentUser(id);
  }
}
