import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTasksRemarksDto } from './dto/create-task-remark.dto';
import { UpdateTasksRemarksDto } from './dto/update-task-remark.dto';

@Injectable()
export class TasksRemarksService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------
  // CREATE NEW REMARK
  // ------------------------------
  async create(dto: CreateTasksRemarksDto) {
    return this.prisma.tasksRemarks.create({
      data: {
        taskId: dto.taskId,
        remark: dto.remark,
        status: dto.status,
        createdBy: dto.createdBy || "System User",
        createdAt: new Date()  // server timestamp only
      },
      include: {
        task: true
      }
    });
  }

  // ------------------------------
  // LIST ALL REMARKS
  // ------------------------------
  async findAll() {
    return this.prisma.tasksRemarks.findMany({
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ------------------------------
  // FIND ONE REMARK
  // ------------------------------
  async findOne(id: number) {
    const remark = await this.prisma.tasksRemarks.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!remark) throw new NotFoundException(`TasksRemarks #${id} not found`);
    return remark;
  }

  // ------------------------------
  // UPDATE A REMARK
  // ------------------------------
  async update(id: number, dto: UpdateTasksRemarksDto) {
    await this.findOne(id);

    return this.prisma.tasksRemarks.update({
      where: { id },
      data: {
        remark: dto.remark,
        status: dto.status,
        createdAt: new Date()  // <-- or overwrite createdAt for edit timestamp
      },
      include: {
        task: true
      }
    });
  }

  // ------------------------------
  // DELETE A REMARK
  // ------------------------------
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tasksRemarks.delete({ where: { id } });
  }
}
