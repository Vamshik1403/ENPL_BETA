import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Site } from '@prisma/client';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSiteDto): Promise<Site> {
    // Generate the proper sequential ID with customer prefix
    const siteID = await this.generateNextSiteId(data.addressBookId);
    
    return this.prisma.site.create({ 
      data: {
        ...data,
        siteID,
      }
    });
  }

  async generateNextSiteId(addressBookId: number): Promise<string> {
    // Get the customer's address book information
    const addressBook = await this.prisma.addressBook.findUnique({
      where: { id: addressBookId }
    });
    
    if (!addressBook) {
      throw new Error('Address book not found');
    }
    
    // Count existing sites for this customer
    const count = await this.prisma.site.count({
      where: { addressBookId }
    });
    
    const nextNumber = String(count + 1).padStart(3, '0');
    return `${addressBook.addressBookID}-SITE/${nextNumber}`;
  }

  findAll(): Promise<Site[]> {
    return this.prisma.site.findMany({ include: { contacts: true } });
  }

  findOne(id: number): Promise<Site | null> {
    return this.prisma.site.findUnique({ where: { id }, include: { contacts: true } });
  }

  update(id: number, data: UpdateSiteDto): Promise<Site> {
    return this.prisma.site.update({ where: { id }, data });
  }

  remove(id: number): Promise<Site> {
    return this.prisma.site.delete({ where: { id } });
  }
}
