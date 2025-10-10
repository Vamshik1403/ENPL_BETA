import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { SupportTicketUsersService } from './create-support-ticket-user.service';
import { CreateSupportTicketUserDto } from './dto/create-create-support-ticket-user.dto';
import { UpdateSupportTicketUserDto } from './dto/update-create-support-ticket-user.dto';


@Controller('support-ticket-users')
export class SupportTicketUsersController {
  constructor(private readonly supportTicketUsersService: SupportTicketUsersService) {}

  @Post()
  create(@Body() createSupportTicketUserDto: CreateSupportTicketUserDto) {
    return this.supportTicketUsersService.create(createSupportTicketUserDto);
  }

  @Get()
  findAll() {
    return this.supportTicketUsersService.findAll();
  }

  @Get('customer/:customerId')
  getUsersByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.supportTicketUsersService.getUsersByCustomer(customerId);
  }

  @Get('site/:siteId')
  getUsersBySite(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.supportTicketUsersService.getUsersBySite(siteId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportTicketUsersService.findOne(id);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.supportTicketUsersService.findByEmail(email);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupportTicketUserDto: UpdateSupportTicketUserDto,
  ) {
    return this.supportTicketUsersService.update(id, updateSupportTicketUserDto);
  }

  @Post(':id/mappings')
  addMapping(
    @Param('id', ParseIntPipe) userId: number,
    @Body() mappingData: { customerId: number; siteId: number },
  ) {
    return this.supportTicketUsersService.addMapping(
      userId,
      mappingData.customerId,
      mappingData.siteId,
    );
  }

  @Delete('mappings/:mappingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMapping(@Param('mappingId', ParseIntPipe) mappingId: number) {
    return this.supportTicketUsersService.removeMapping(mappingId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportTicketUsersService.remove(id);
  }
}