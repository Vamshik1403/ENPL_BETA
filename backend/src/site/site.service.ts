import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Site } from '@prisma/client';
import { CreateSiteContactDto } from './dto/create-site-contact.dto';
import { UpdateSiteContactDto } from './dto/update-site-contact.dto';

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
    return this.prisma.site.findUnique({
      where: { id },
      include: { contacts: true, addressBook:true, tasks: true },
    });
  }

findAllBasedOnCust(addressBookId?: string) {
  return this.prisma.site.findMany({
    where: addressBookId
      ? { addressBookId: Number(addressBookId) }
      : undefined,
    orderBy: { siteName: 'asc' },
  });
}


  async update(id: number, data: UpdateSiteDto) {
    // Remove any nested relations from the data
    const { contacts, ...siteData } = data as any;
    
    return this.prisma.site.update({
      where: { id },
      data: siteData,
      include: {
        addressBook: true,
        contacts: true,
      },
    });
  }

   // Contact management methods
  async getSiteContacts(siteId: number) {
    return this.prisma.siteContact.findMany({
      where: { siteId },
    });
  }

  async createSiteContact(siteId: number, data: CreateSiteContactDto) {
    return this.prisma.siteContact.create({
      data: {
        ...data,
        siteId,
      },
    });
  }

  async updateSiteContact(contactId: number, data: UpdateSiteContactDto) {
    return this.prisma.siteContact.update({
      where: { id: contactId },
      data,
    });
  }

  async deleteSiteContact(contactId: number) {
    return this.prisma.siteContact.delete({
      where: { id: contactId },
    });
  }

  remove(id: number): Promise<Site> {
    return this.prisma.site.delete({ where: { id } });
  }

  // SiteContact management methods
  async addContact(siteId: number, data: { contactPerson: string; designation: string; contactNumber: string; emailAddress: string }): Promise<any> {
    return this.prisma.siteContact.create({
      data: { ...data, siteId },
    });
  }

  async updateContact(contactId: number, data: Partial<{ contactPerson: string; designation: string; contactNumber: string; emailAddress: string }>): Promise<any> {
    return this.prisma.siteContact.update({
      where: { id: contactId },
      data,
    });
  }

  async removeContact(contactId: number): Promise<any> {
    return this.prisma.siteContact.delete({
      where: { id: contactId },
    });
  }

  async findContacts(siteId: number): Promise<any[]> {
    return this.prisma.siteContact.findMany({
      where: { siteId },
    });
  }

  async findOneContact(contactId: number): Promise<any | null> {
    return this.prisma.siteContact.findUnique({
      where: { id: contactId },
    });
  }
}
