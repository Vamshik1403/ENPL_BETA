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
}
