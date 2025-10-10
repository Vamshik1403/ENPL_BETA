import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class SupportTicketMappingDto {
  @IsInt()
  customerId: number;

  @IsInt()
  siteId: number;
}

export class CreateSupportTicketUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupportTicketMappingDto)
  mappings: SupportTicketMappingDto[];
}