import { IsInt, IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskContactDto {
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;
}

export class CreateTaskWorkscopeDetailDto {
  @IsInt()
  @IsNotEmpty()
  workscopeCategoryId: number;

  @IsString()
  @IsNotEmpty()
  workscopeDetails: string;

  @IsString()
  @IsOptional()
  extraNote?: string;
}

export class CreateTaskScheduleDto {
  @IsString()
  @IsNotEmpty()
  proposedDateTime: string;

  @IsString()
  @IsNotEmpty()
  priority: string;
}

export class CreateTaskRemarkDto {
  @IsString()
  @IsNotEmpty()
  remark: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}

export class CreateTaskDto {
  @IsInt()
  departmentId: number;

  @IsInt()
  addressBookId: number;

  @IsInt()
  siteId: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskContactDto)
  contacts?: CreateTaskContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskWorkscopeDetailDto)
  workscopeDetails?: CreateTaskWorkscopeDetailDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskScheduleDto)
  schedule?: CreateTaskScheduleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskRemarkDto)
  remarks?: CreateTaskRemarkDto[];
}
