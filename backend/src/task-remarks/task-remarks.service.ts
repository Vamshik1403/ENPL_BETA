import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTasksRemarksDto } from './dto/create-task-remark.dto';
import { UpdateTasksRemarksDto } from './dto/update-task-remark.dto';

@Injectable()
export class TasksRemarksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTasksRemarksDto) {
    return this.prisma.tasksRemarks.create({
      data: dto,
      include: { task: true },
    });
  }

  async findAll() {
    return this.prisma.tasksRemarks.findMany({
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const remark = await this.prisma.tasksRemarks.findUnique({
      where: { id },
      include: { task: true },
    });
    if (!remark) throw new NotFoundException(`TasksRemarks #${id} not found`);
    return remark;
  }

  async update(id: number, dto: UpdateTasksRemarksDto) {
    await this.findOne(id);
    return this.prisma.tasksRemarks.update({
      where: { id },
      data: dto,
      include: { task: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tasksRemarks.delete({ where: { id } });
  }
}
