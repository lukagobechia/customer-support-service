import { IsNotEmpty, IsString, Matches } from "class-validator";

const passwordRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;


export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @Matches(passwordRegEx, {
    message:
      "Password must contain at least 8 and maximum 20 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
  })
  password: string;

  @IsNotEmpty()
  @Matches(passwordRegEx, {
    message:
      "Password must contain at least 8 and maximum 20 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
  })
  repeatPassword: string;
}
