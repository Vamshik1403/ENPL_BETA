import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractInventoryDto } from './dto/create-service-contract-inventory.dto';
import { UpdateServiceContractInventoryDto } from './dto/update-service-contract-inventory.dto';
import { add, differenceInDays } from 'date-fns';

@Injectable()
export class ServiceContractInventoryService {
  constructor(private prisma: PrismaService) {}

  private computeWarrantyStatus(purchaseDate: Date, warrantyPeriod: string): string {
    // Example: if warrantyPeriod = "12 months"
    const months = parseInt(warrantyPeriod);
    const expiryDate = add(purchaseDate, { months });
    return expiryDate > new Date() ? 'Active' : 'Expired';
  }

  async create(dto: CreateServiceContractInventoryDto) {
    // Compute warranty status before creating
    const warrantyStatus = this.computeWarrantyStatus(dto.purchaseDate, dto.warrantyPeriod);
    
    const record = await this.prisma.serviceContractInventory.create({
      data: {
        ...dto,
        warrantyStatus,
      },
      include: { serviceContract: true, productType: true },
    });

    return { ...record, warrantyStatus };
  }

  async findAll() {
    const records = await this.prisma.serviceContractInventory.findMany({
      include: { serviceContract: true, productType: true },
    });

    return records.map(r => ({
      ...r,
      warrantyStatus: this.computeWarrantyStatus(r.purchaseDate, r.warrantyPeriod),
    }));
  }

  async findOne(id: number) {
    const record = await this.prisma.serviceContractInventory.findUnique({
      where: { id },
      include: { serviceContract: true, productType: true },
    });

    if (!record) throw new NotFoundException(`ServiceContractInventory #${id} not found`);

    return { ...record, warrantyStatus: this.computeWarrantyStatus(record.purchaseDate, record.warrantyPeriod) };
  }

  async update(id: number, dto: UpdateServiceContractInventoryDto) {
    await this.findOne(id);

    const record = await this.prisma.serviceContractInventory.update({
      where: { id },
      data: dto,
      include: { serviceContract: true, productType: true },
    });

    return { ...record, warrantyStatus: this.computeWarrantyStatus(record.purchaseDate, record.warrantyPeriod) };
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContractInventory.delete({ where: { id } });
  }
}
