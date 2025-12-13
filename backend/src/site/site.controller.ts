import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateSiteContactDto } from './dto/create-site-contact.dto';
import { UpdateSiteContactDto } from './dto/update-site-contact.dto';
import { SitesService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';

@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SitesService) {}

    @Post()
  create(@Body() dto: CreateSiteDto) {
    return this.siteService.create(dto);
  }

  

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    return this.siteService.update(+id, updateSiteDto);
  }

  @Get()
  findAll() {
    return this.siteService.findAll();
  }

  @Get('based-on-cust')
  findAllBasedOnCust(@Query('addressBookId') addressBookId?: string) {
    return this.siteService.findAllBasedOnCust(addressBookId);
  }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.siteService.findOne(Number(id));
    }
  

  // Contact endpoints
  @Get(':id/contacts')
  getContacts(@Param('id') id: string) {
    return this.siteService.getSiteContacts(+id);
  }

  @Post(':id/contacts')
  addContact(@Param('id') id: string, @Body() createContactDto: CreateSiteContactDto) {
    return this.siteService.createSiteContact(+id, createContactDto);
  }

  @Put('contacts/:contactId')
  updateContact(@Param('contactId') contactId: string, @Body() updateContactDto: UpdateSiteContactDto) {
    return this.siteService.updateSiteContact(+contactId, updateContactDto);
  }

  @Delete('contacts/:contactId')
  removeContact(@Param('contactId') contactId: string) {
    return this.siteService.deleteSiteContact(+contactId);
  }
}