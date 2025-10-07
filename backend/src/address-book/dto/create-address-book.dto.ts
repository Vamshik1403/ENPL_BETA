import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAddressBookDto {
  @IsString() @IsNotEmpty() addressType: string;
  @IsString() @IsNotEmpty() customerName: string;
  @IsString() @IsNotEmpty() regdAddress: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() pinCode?: string;
  @IsString() @IsNotEmpty() gstNo: string;
}
