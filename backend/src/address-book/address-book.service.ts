import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressBookDto } from './dto/create-address-book.dto';
import { UpdateAddressBookDto } from './dto/update-address-book.dto';
import { Prisma, AddressBook, AddressBookContact } from '@prisma/client';

@Injectable()
export class AddressBookService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAddressBookDto): Promise<AddressBook> {
    // Generate the proper sequential ID for Customer
    const addressBookID = await this.generateNextId('Customer');
    
    return this.prisma.addressBook.create({ 
      data: {
        ...data,
        addressType: 'Customer', // Always set to Customer
        addressBookID,
      }
    });
  }

  async generateNextId(addressType: string = 'Customer'): Promise<string> {
    const prefix = 'CUS'; // Always use CUS prefix
    
    // Count existing Customer records
    const count = await this.prisma.addressBook.count({
      where: { addressType: 'Customer' }
    });
    
    const nextNumber = String(count + 1).padStart(3, '0');
    return `${prefix}/${nextNumber}`;
  }

  findAll(): Promise<AddressBook[]> {
    return this.prisma.addressBook.findMany({
      include: { contacts: true, sites: true, tasks: true },
    });
  }

  findOne(id: number): Promise<AddressBook | null> {
    return this.prisma.addressBook.findUnique({
      where: { id },
      include: { contacts: true, sites: true, tasks: true },
    });
  }

  update(id: number, data: UpdateAddressBookDto): Promise<AddressBook> {
    return this.prisma.addressBook.update({
      where: { id },
      data,
    });
  }

  remove(id: number): Promise<AddressBook> {
    return this.prisma.addressBook.delete({ where: { id } });
  }

  // Contact management methods
  async findContacts(addressBookId: number): Promise<AddressBookContact[]> {
    return this.prisma.addressBookContact.findMany({
      where: { addressBookId },
    });
  }

  async addContact(addressBookId: number, data: Omit<AddressBookContact, 'id' | 'addressBookId'>): Promise<AddressBookContact> {
    return this.prisma.addressBookContact.create({
      data: {
        ...data,
        addressBookId,
      },
    });
  }

  async updateContact(contactId: number, data: Partial<AddressBookContact>): Promise<AddressBookContact> {
    return this.prisma.addressBookContact.update({
      where: { id: contactId },
      data,
    });
  }

  async removeContact(contactId: number): Promise<AddressBookContact> {
    return this.prisma.addressBookContact.delete({
      where: { id: contactId },
    });
  }

  async findOneContact(contactId: number): Promise<AddressBookContact | null> {
    return this.prisma.addressBookContact.findUnique({
      where: { id: contactId },
    });
  }
}
