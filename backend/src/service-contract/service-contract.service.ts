import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractDto } from './dto/create-service-contract.dto';
import { UpdateServiceContractDto } from './dto/update-service-contract.dto';

@Injectable()
export class ServiceContractService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateServiceContractDto) {
  // 🔢 Step 1: Find last contract ID (numerically highest)
  const lastContract = await this.prisma.serviceContract.findFirst({
    orderBy: { id: 'desc' },
    select: { serviceContractID: true },
  });

  // 🔢 Step 2: Extract number and increment
  let nextNumber = 1;
  if (lastContract?.serviceContractID) {
    const match = lastContract.serviceContractID.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  // 🔢 Step 3: Format like EN/CSR/00001
  const nextID = `EN/CSR/${nextNumber.toString().padStart(5, '0')}`;

  // 🔢 Step 4: Create record with generated ID
  return this.prisma.serviceContract.create({
    data: {
      serviceContractID: nextID,
      customerId: createDto.customerId,
      branchId: createDto.branchId,
      salesManagerName: createDto.salesManagerName,
    },
  });
}

async getNextContractId() {
  const lastContract = await this.prisma.serviceContract.findFirst({
    orderBy: { id: 'desc' },
    select: { serviceContractID: true },
  });

  let nextNumber = 1;
  if (lastContract?.serviceContractID) {
    const match = lastContract.serviceContractID.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const nextID = `EN/CSR/${nextNumber.toString().padStart(5, '0')}`;

  return { nextID };
}



  async findAll() {
    return this.prisma.serviceContract.findMany({
      include: {
        periods: true,
        terms: true,
        services: true,
        inventories: true,
        histories: true,
      },
    });
  }

  async findOne(id: number) {
    const contract = await this.prisma.serviceContract.findUnique({
      where: { id },
      include: {
        periods: true,
        terms: true,
        services: true,
        inventories: true,
        histories: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Service Contract #${id} not found`);
    }

    return contract;
  }

  async update(id: number, updateDto: UpdateServiceContractDto) {
    await this.findOne(id);
    return this.prisma.serviceContract.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContract.delete({
      where: { id },
    });
  }
}
