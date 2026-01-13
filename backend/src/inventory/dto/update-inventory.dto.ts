import { IsString, IsNumber, IsDate, IsOptional, IsArray } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsNumber()
  vendorId?: number;
 

  @IsOptional()
  @IsDate()
  purchaseDate?: Date;

  @IsOptional()
  @IsString()
  purchaseInvoice?: string;

  @IsOptional()
  @IsString()
  creditTerms?: string;  // Ensure creditTerms is optional and can be updated

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  invoiceNetAmount?: string;

  @IsOptional()
  @IsString()
  gstAmount?: string;

  @IsOptional()
  @IsString()
  invoiceGrossAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

    @IsOptional()
  @IsString()
  dueAmount?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsArray()
  products?: {
    productId: number;
    make: string;
    model: string;
    serialNumber: string;
    macAddress: string;
    warrantyPeriod: string;
    purchaseRate: string;
  }[];
}
