import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceContractDto {
  @IsInt()
  customerId: number;

  @IsInt()
  branchId: number;

  @IsString()
  @IsNotEmpty()
  salesManagerName: string;
}
