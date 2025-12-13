import { IsInt, IsString } from 'class-validator';

export class CreateComplaintRegistrationDto {
  @IsInt()
  customerId: number;

  @IsInt()
  siteId: number;

  @IsInt()
  departmentId: number;

  @IsString()
  title: string;

  @IsString()
  description: string;
}
