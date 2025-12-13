import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ComplaintRegistrationService } from './complaint-registration.service';
import { CreateComplaintRegistrationDto } from './dto/create-complaint-registration.dto';
import { UpdateComplaintRegistrationDto } from './dto/update-complaint-registration.dto';

@Controller('complaint-registration')
export class ComplaintRegistrationController {
  constructor(private readonly service: ComplaintRegistrationService) {}

  @Post()
  create(@Body() dto: CreateComplaintRegistrationDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  

  

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateComplaintRegistrationDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
