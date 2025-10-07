import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractDto } from './dto/create-service-contract.dto';
import { UpdateServiceContractDto } from './dto/update-service-contract.dto';

@Injectable()
export class ServiceContractService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateServiceContractDto) {
    return this.prisma.serviceContract.create({
      data: createDto,
    });
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
