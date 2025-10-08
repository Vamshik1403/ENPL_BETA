import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    const { contacts, workscopeDetails, schedule, remarks, ...taskData } = dto as any;
    
    // Generate auto Task ID
    const taskID = await this.generateNextTaskId();
    
    // Create the main task first
    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        taskID,
        createdBy: 'System User', // TODO: Replace with actual logged-in user
        createdAt: taskData.createdAt ? new Date(taskData.createdAt) : undefined,
      },
    });

    // Create related records if they exist
    if (contacts && contacts.length > 0) {
      await this.prisma.tasksContacts.createMany({
        data: contacts.map((contact: any) => ({
          taskId: task.id,
          contactName: contact.contactName,
          contactNumber: contact.contactNumber,
          contactEmail: contact.contactEmail,
        }))
      });
    }

    if (workscopeDetails && workscopeDetails.length > 0) {
      await this.prisma.tasksWorkscopeDetails.createMany({
        data: workscopeDetails.map((detail: any) => ({
          taskId: task.id,
          workscopeCategoryId: parseInt(detail.workscopeCategoryId),
          workscopeDetails: detail.workscopeDetails,
          extraNote: detail.extraNote,
        }))
      });
    }

    if (schedule && schedule.length > 0) {
      await this.prisma.tasksSchedule.createMany({
        data: schedule.map((sched: any) => ({
          taskId: task.id,
          proposedDateTime: new Date(sched.proposedDateTime),
          priority: sched.priority,
        }))
      });
    }

    if (remarks && remarks.length > 0) {
      await this.prisma.tasksRemarks.createMany({
        data: remarks.map((remark: any) => ({
          taskId: task.id,
          remark: remark.remark,
          createdBy: 'System User', // TODO: Replace with actual logged-in user
        }))
      });
    }

    // Return the task with all related data
    return this.prisma.task.findUnique({
      where: { id: task.id },
      include: {
        department: true,
        addressBook: true,
        site: true,
        contacts: true,
        workscopeCat: true,
        workscopeDetails: true,
        schedule: true,
        remarks: true,
      },
    });
  }

  async generateNextTaskId(): Promise<string> {
    // Count existing tasks
    const count = await this.prisma.task.count();
    
    const nextNumber = String(count + 1).padStart(5, '0');
    return `EN/SR/${nextNumber}`;
  }

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        department: true,
        addressBook: true,
        site: true,
        contacts: true,
        workscopeCat: true,
        workscopeDetails: true,
        schedule: true,
        remarks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        department: true,
        addressBook: true,
        site: true,
        contacts: true,
        workscopeCat: true,
        workscopeDetails: true,
        schedule: true,
        remarks: true,
      },
    });

    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, dto: UpdateTaskDto) {
    await this.findOne(id);
    
    // Extract only the fields that should be updated
    const { contacts, workscopeDetails, schedule, remarks, ...updateData } = dto as any;
    
    // Update the main task first
    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Delete existing nested records
    await this.prisma.tasksContacts.deleteMany({ where: { taskId: id } });
    await this.prisma.tasksWorkscopeDetails.deleteMany({ where: { taskId: id } });
    await this.prisma.tasksSchedule.deleteMany({ where: { taskId: id } });
    await this.prisma.tasksRemarks.deleteMany({ where: { taskId: id } });

    // Create new nested records if they exist
    if (contacts && contacts.length > 0) {
      await this.prisma.tasksContacts.createMany({
        data: contacts.map((contact: any) => ({
          taskId: id,
          contactName: contact.contactName,
          contactNumber: contact.contactNumber,
          contactEmail: contact.contactEmail,
        }))
      });
    }

    if (workscopeDetails && workscopeDetails.length > 0) {
      await this.prisma.tasksWorkscopeDetails.createMany({
        data: workscopeDetails.map((detail: any) => ({
          taskId: id,
          workscopeCategoryId: parseInt(detail.workscopeCategoryId),
          workscopeDetails: detail.workscopeDetails,
          extraNote: detail.extraNote,
        }))
      });
    }

    if (schedule && schedule.length > 0) {
      await this.prisma.tasksSchedule.createMany({
        data: schedule.map((sched: any) => ({
          taskId: id,
          proposedDateTime: new Date(sched.proposedDateTime),
          priority: sched.priority,
        }))
      });
    }

    if (remarks && remarks.length > 0) {
      await this.prisma.tasksRemarks.createMany({
        data: remarks.map((remark: any) => ({
          taskId: id,
          remark: remark.remark,
          createdBy: 'System User', // TODO: Replace with actual logged-in user
        }))
      });
    }

    // Return the updated task with all related data
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        department: true,
        addressBook: true,
        site: true,
        contacts: true,
        workscopeCat: true,
        workscopeDetails: true,
        schedule: true,
        remarks: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}
