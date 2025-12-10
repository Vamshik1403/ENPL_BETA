import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

 async create(dto: CreateTaskDto) {
  const { contacts, workscopeDetails, schedule, remarks, ...taskData } = dto as any;

  // 🧩 Auto-generate Task ID based on current timestamp
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // e.g. "25"
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
const taskID = `ENSR${year}${month}${day}${hours}${minutes}${seconds}`;

  // 🟢 Create the main task
  const task = await this.prisma.task.create({
    data: {
      ...taskData,
      taskID,
      createdBy: 'System User', // TODO: replace with actual user when auth added
      createdAt: taskData.createdAt ? new Date(taskData.createdAt) : undefined,
    },
  });

  // 🧩 Create related records
  if (contacts?.length) {
    await this.prisma.tasksContacts.createMany({
      data: contacts.map((c: any) => ({
        taskId: task.id,
        contactName: c.contactName,
        contactNumber: c.contactNumber,
        contactEmail: c.contactEmail,
      })),
    });
  }

  if (workscopeDetails?.length) {
    await this.prisma.tasksWorkscopeDetails.createMany({
      data: workscopeDetails.map((d: any) => ({
        taskId: task.id,
        workscopeCategoryId: parseInt(d.workscopeCategoryId),
        workscopeDetails: d.workscopeDetails,
        extraNote: d.extraNote,
      })),
    });
  }

  if (schedule?.length) {
    await this.prisma.tasksSchedule.createMany({
      data: schedule.map((s: any) => ({
        taskId: task.id,
        proposedDateTime: new Date(s.proposedDateTime),
        priority: s.priority,
      })),
    });
  }

if (remarks?.length === 1) {
  await this.prisma.tasksRemarks.create({
    data: {
      taskId: task.id,
      remark: remarks[0].remark,
      status: remarks[0].status,
      createdBy: remarks[0].createdBy || "System User",
      createdAt: remarks[0].createdAt ? new Date(remarks[0].createdAt) : new Date()
    }
  });
}



  // 🧠 Return full task with relations
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

  // Extract nested arrays (remarks MUST NOT be handled here)
  const { contacts, workscopeDetails, schedule, remarks, ...updateData } = dto as any;

  // Update only main task fields
  await this.prisma.task.update({
    where: { id },
    data: updateData,
  });

  // --- UPDATE CONTACTS ---
  await this.prisma.tasksContacts.deleteMany({ where: { taskId: id } });
  if (contacts?.length > 0) {
    await this.prisma.tasksContacts.createMany({
      data: contacts.map((c: any) => ({
        taskId: id,
        contactName: c.contactName,
        contactNumber: c.contactNumber,
        contactEmail: c.contactEmail,
      })),
    });
  }

  // --- UPDATE WORKSCOPE DETAILS ---
  await this.prisma.tasksWorkscopeDetails.deleteMany({ where: { taskId: id } });
  if (workscopeDetails?.length > 0) {
    await this.prisma.tasksWorkscopeDetails.createMany({
      data: workscopeDetails.map((d: any) => ({
        taskId: id,
        workscopeCategoryId: parseInt(d.workscopeCategoryId),
        workscopeDetails: d.workscopeDetails,
        extraNote: d.extraNote,
      })),
    });
  }

  // --- UPDATE SCHEDULE ---
  await this.prisma.tasksSchedule.deleteMany({ where: { taskId: id } });
  if (schedule?.length > 0) {
    await this.prisma.tasksSchedule.createMany({
      data: schedule.map((s: any) => ({
        taskId: id,
        proposedDateTime: new Date(s.proposedDateTime),
        priority: s.priority,
      })),
    });
  }

  // --- 🚫 DO NOT TOUCH REMARKS HERE ---
  // remarks array is intentionally ignored
  // remarks are handled ONLY through TasksRemarksService (create/update)
  
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
      remarks: true, // remarks preserved correctly
    },
  });
}

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}