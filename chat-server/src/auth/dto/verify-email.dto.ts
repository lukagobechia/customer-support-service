import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class VeridyEmailDto {

    @IsNotEmpty()
    @IsEmail()
    email:string

    @IsString()
    @IsNotEmpty()
    otpCode: string
}