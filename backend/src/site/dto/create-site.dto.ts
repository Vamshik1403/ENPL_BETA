import { IsString, IsOptional, IsNotEmpty, IsInt } from 'class-validator';

export class CreateSiteDto {
  @IsInt() addressBookId: number;
  @IsString() @IsNotEmpty() siteName: string;
  @IsString() @IsNotEmpty() siteAddress: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() pinCode?: string;
  @IsString() @IsNotEmpty() gstNo: string;
}
