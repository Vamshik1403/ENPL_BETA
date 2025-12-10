import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceContractDto {
  @IsInt()
  customerId: number;

  @IsInt()
  branchId: number;

  @IsString()
  salesManagerName: string;

  @IsString()
  amcType: string;
}
