import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtGuard } from 'src/auth/jwt.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('by-customer/:customerId')
findByCustomer(
  @Param('customerId', ParseIntPipe) customerId: number,
) {
  return this.taskService.findByCustomer(customerId);
}

@Post('by-customers')
findByCustomers(@Body('customerIds') customerIds: number[]) {
  return this.taskService.findByCustomers(customerIds);
}



@Post()
create(@Body() dto: CreateTaskDto) {
  return this.taskService.create(dto, dto.userId);
}



  @Get()
  findAll() {
    return this.taskService.findAll();
  }


  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Post(':id/customer-remark')
addCustomerRemark(
  @Param('id', ParseIntPipe) taskId: number,
  @Body() body: { remark: string; status?: string; createdBy: string },
) {
  return this.taskService.addCustomerRemark(taskId, body);
}


  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Request() req, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }
}
