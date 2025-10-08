import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { SitesService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Controller('sites')
export class SitesController {
  constructor(private readonly service: SitesService) {}

  @Get('next-id/:addressBookId')
  getNextId(@Param('addressBookId') addressBookId: string) {
    return this.service.generateNextSiteId(Number(addressBookId));
  }

  @Post()
  create(@Body() dto: CreateSiteDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  // SiteContact endpoints
  @Post(':id/contacts')
  async addContact(@Param('id') id: string, @Body() data: { contactPerson: string; designation: string; contactNumber: string; emailAddress: string }): Promise<any> {
    return this.service.addContact(Number(id), data);
  }

  @Get(':id/contacts')
  async findContacts(@Param('id') id: string): Promise<any[]> {
    return this.service.findContacts(Number(id));
  }

  @Put('contacts/:contactId')
  async updateContact(@Param('contactId') contactId: string, @Body() data: Partial<{ contactPerson: string; designation: string; contactNumber: string; emailAddress: string }>): Promise<any> {
    return this.service.updateContact(Number(contactId), data);
  }

  @Delete('contacts/:contactId')
  async removeContact(@Param('contactId') contactId: string): Promise<any> {
    return this.service.removeContact(Number(contactId));
  }

  @Get('contacts/:contactId')
  async findOneContact(@Param('contactId') contactId: string): Promise<any> {
    return this.service.findOneContact(Number(contactId));
  }
}
