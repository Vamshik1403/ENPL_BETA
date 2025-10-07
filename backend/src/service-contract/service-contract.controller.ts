import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ServiceContractService } from './service-contract.service';
import { CreateServiceContractDto } from './dto/create-service-contract.dto';
import { UpdateServiceContractDto } from './dto/update-service-contract.dto';

@Controller('service-contract')
export class ServiceContractController {
  constructor(private readonly serviceContractService: ServiceContractService) {}

  @Post()
  create(@Body() createDto: CreateServiceContractDto) {
    return this.serviceContractService.create(createDto);
  }

  @Get()
  findAll() {
    return this.serviceContractService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateServiceContractDto) {
    return this.serviceContractService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractService.remove(id);
  }
}
