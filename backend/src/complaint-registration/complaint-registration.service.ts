import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateComplaintRegistrationDto } from './dto/create-complaint-registration.dto';
import { UpdateComplaintRegistrationDto } from './dto/update-complaint-registration.dto';

@Injectable()
export class ComplaintRegistrationService {
  constructor(private prisma: PrismaService) {}

 async create(dto: CreateComplaintRegistrationDto) {
  const now = new Date();

  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const datePart = `${yy}${mm}${dd}`;

  // Count today's complaints for sequence
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  const todayCount = await this.prisma.complaintRegistration.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = String(todayCount + 1).padStart(4, '0');

  const complaintID = `EN-CMP-${datePart}-${sequence}`;

  return this.prisma.complaintRegistration.create({
    data: {
      ...dto,
      complaintID,
    },
  });
}




  findAll() {
    return this.prisma.complaintRegistration.findMany({
      include: {
        site: true,
        addressBook: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.complaintRegistration.findUnique({
      where: { id },
      include: {
        site: true,
        addressBook: true,
        department: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Complaint #${id} not found`);
    }
    return record;
  }

  async update(id: number, dto: UpdateComplaintRegistrationDto) {
    await this.findOne(id);

    return this.prisma.complaintRegistration.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.complaintRegistration.delete({
      where: { id },
    });
  }
}
