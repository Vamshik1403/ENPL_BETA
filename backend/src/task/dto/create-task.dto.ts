import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsInt()
  departmentId: number;

  @IsInt()
  addressBookId: number;

  @IsInt()
  siteId: number;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
