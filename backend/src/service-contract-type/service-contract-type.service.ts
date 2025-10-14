import { Injectable } from '@nestjs/common';
import { CreateServiceContractTypeDto } from './dto/create-service-contract-type.dto';
import { UpdateServiceContractTypeDto } from './dto/update-service-contract-type.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceContractTypeService {
  constructor(private prisma: PrismaService) {}

 async create(data: any) {
  const { billingSchedule, ...mainData } = data;

  const contractType = await this.prisma.serviceContractType.create({ data: mainData });

  if (billingSchedule?.length) {
    await this.prisma.serviceContractBilling.createMany({
      data: billingSchedule.map((b: any) => ({
        serviceContractTypeId: contractType.id,
        dueDate: b.dueDate,
        paymentStatus: b.paymentStatus,
        overdueDays: b.overdueDays,
      })),
    });
  }

  return contractType;
}


  findAll() {
    return this.prisma.serviceContractType.findMany({
      include: { serviceContract: true },
    });
  }

  findOne(id: number) {
    return this.prisma.serviceContractType.findUnique({
      where: { id },
      include: { serviceContract: true },
    });
  }

async update(id: number, data: any) {
  const { billingSchedule, ...updateData } = data;

  // 🟢 Step 1 – Try to find existing ServiceContractType by contract ID
  let existingType = await this.prisma.serviceContractType.findFirst({
    where: { serviceContractId: id },
  });

  // 🟡 Step 2 – If not found, create one automatically
  if (!existingType) {
    existingType = await this.prisma.serviceContractType.create({
      data: {
        serviceContractType: updateData.serviceContractType || 'Free',
        serviceContractId: id,
        billingType: updateData.billingType || '',
        billingCycle: updateData.billingCycle || '',
        billingDueDate: updateData.billingDueDate || '',
        paymentStatus: updateData.paymentStatus || 'Paid',
      },
    });
  }

  const typeId = existingType.id;

  // 🟢 Step 3 – Update the ServiceContractType record
  const updated = await this.prisma.serviceContractType.update({
    where: { id: typeId },
    data: updateData,
  });

  // 🟢 Step 4 – Refresh billing schedule
  if (billingSchedule && Array.isArray(billingSchedule)) {
    await this.prisma.serviceContractBilling.deleteMany({
      where: { serviceContractTypeId: typeId },
    });

    if (billingSchedule.length > 0) {
      await this.prisma.serviceContractBilling.createMany({
        data: billingSchedule.map((b: any) => ({
          serviceContractTypeId: typeId,
          dueDate: b.dueDate,
          paymentStatus: b.paymentStatus,
          overdueDays: b.overdueDays ?? 0,
        })),
      });
    }
  }

  // 🟢 Step 5 – Return with full relations
 return this.prisma.serviceContractType.findUnique({
  where: { id: typeId },
  include: {
    serviceContract: true,
    serviceContractBillings: true, 
  },
});

}

 async remove(id: number) {
  // Delete all related billing schedule entries first (safe fallback)
  await this.prisma.serviceContractBilling.deleteMany({
    where: { serviceContractTypeId: id },
  });

  // Then delete the service contract type itself
  return this.prisma.serviceContractType.delete({ where: { id } });
}

}
