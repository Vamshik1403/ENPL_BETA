import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportTicketUserDto } from './dto/create-create-support-ticket-user.dto';
import { UpdateSupportTicketUserDto } from './dto/update-create-support-ticket-user.dto';


@Injectable()
export class SupportTicketUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSupportTicketUserDto: CreateSupportTicketUserDto) {
    const { mappings, ...userData } = createSupportTicketUserDto;

    return await this.prisma.supportTicketUser.create({
      data: {
        ...userData,
        supportTicketMappings: {
          create: mappings,
        },
      },
      include: {
        supportTicketMappings: {
          include: {
            addressBook: true,
            site: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.supportTicketUser.findMany({
      include: {
        supportTicketMappings: {
          include: {
            addressBook: true,
            site: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const supportTicketUser = await this.prisma.supportTicketUser.findUnique({
      where: { id },
      include: {
        supportTicketMappings: {
          include: {
            addressBook: true,
            site: true,
          },
        },
      },
    });

    if (!supportTicketUser) {
      throw new NotFoundException(`SupportTicketUser with ID ${id} not found`);
    }

    return supportTicketUser;
  }

  async findByEmail(email: string) {
    const supportTicketUser = await this.prisma.supportTicketUser.findFirst({
      where: { email },
      include: {
        supportTicketMappings: {
          include: {
            addressBook: true,
            site: true,
          },
        },
      },
    });

    if (!supportTicketUser) {
      throw new NotFoundException(`SupportTicketUser with email ${email} not found`);
    }

    return supportTicketUser;
  }

  async update(id: number, updateSupportTicketUserDto: UpdateSupportTicketUserDto) {
    // Check if user exists
    await this.findOne(id);

    const { mappings, ...userData } = updateSupportTicketUserDto;

    // If mappings are provided, update them
    if (mappings) {
      // First delete existing mappings
      await this.prisma.supportTicketMapping.deleteMany({
        where: { supportTicketUserId: id },
      });

      // Then create new mappings
      return await this.prisma.supportTicketUser.update({
        where: { id },
        data: {
          ...userData,
          supportTicketMappings: {
            create: mappings,
          },
        },
        include: {
          supportTicketMappings: {
            include: {
              addressBook: true,
              site: true,
            },
          },
        },
      });
    }

    // If no mappings provided, just update user data
    return await this.prisma.supportTicketUser.update({
      where: { id },
      data: userData,
      include: {
        supportTicketMappings: {
          include: {
            addressBook: true,
            site: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    // Check if user exists
    await this.findOne(id);

    // Delete will cascade to mappings due to onDelete: Cascade
    return await this.prisma.supportTicketUser.delete({
      where: { id },
    });
  }

  async addMapping(userId: number, customerId: number, siteId: number) {
    await this.findOne(userId);

    return await this.prisma.supportTicketMapping.create({
      data: {
        supportTicketUserId: userId,
        customerId,
        siteId,
      },
      include: {
        addressBook: true,
        site: true,
        supportTicketUser: true,
      },
    });
  }

  async removeMapping(mappingId: number) {
    const mapping = await this.prisma.supportTicketMapping.findUnique({
      where: { id: mappingId },
    });

    if (!mapping) {
      throw new NotFoundException(`SupportTicketMapping with ID ${mappingId} not found`);
    }

    return await this.prisma.supportTicketMapping.delete({
      where: { id: mappingId },
    });
  }

  async getUsersByCustomer(customerId: number) {
    return await this.prisma.supportTicketUser.findMany({
      where: {
        supportTicketMappings: {
          some: {
            customerId,
          },
        },
      },
      include: {
        supportTicketMappings: {
          where: {
            customerId,
          },
          include: {
            addressBook: true,
            site: true,
          },
        },
      },
    });
  }

  async getUsersBySite(siteId: number) {
    return await this.prisma.supportTicketUser.findMany({
      where: {
        supportTicketMappings: {
          some: {
            siteId,
          },
        },
      },
      include: {
        supportTicketMappings: {
          where: {
            siteId,
          },
          include: {
            addressBook: true,
            site: true,
          },
        },
      },
    });
  }
}