import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto,loggedInUserId: number) {
    const { 
      contacts, 
      workscopeDetails, 
      schedule, 
      remarks, 
      taskInventories,
      ...taskData 
    } = dto as any;

    // 🧩 Auto-generate Task ID
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const taskID = `ENSR${year}${month}${day}${hours}${minutes}${seconds}`;

    // 🟢 Create main task
    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        taskID,
        status: 'open',
        createdBy: 'System User',
        userId: loggedInUserId,
        createdAt: taskData.createdAt ? new Date(taskData.createdAt) : undefined,
      },
    });

    // --- CONTACTS ---
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

    // --- WORKSCOPE DETAILS ---
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

    // --- SCHEDULE ---
    if (schedule?.length) {
      await this.prisma.tasksSchedule.createMany({
        data: schedule.map((s: any) => ({
          taskId: task.id,
          proposedDateTime: new Date(s.proposedDateTime),
          priority: s.priority,
        })),
      });
    }

    // --- REMARK (only 1 allowed on create) ---
    if (remarks?.length === 1) {
      await this.prisma.tasksRemarks.create({
        data: {
          taskId: task.id,
          remark: remarks[0].remark,
          status: remarks[0].status,
          createdBy: remarks[0].createdBy || 'System User',
          createdAt: remarks[0].createdAt ? new Date(remarks[0].createdAt) : new Date(),
        },
      });
    }

    // --- INVENTORIES ---
    if (taskInventories?.length) {
      for (const inv of taskInventories) {
        await this.prisma.taskInventory.create({
          data: {
            taskId: task.id,
            serviceContractId: inv.serviceContractId,
            productTypeId: inv.productTypeId,
            makeModel: inv.makeModel,
            snMac: inv.snMac,
            description: inv.description,
            purchaseDate: new Date(inv.purchaseDate),
            warrantyPeriod: inv.warrantyPeriod,
            warrantyStatus: inv.warrantyStatus,
            thirdPartyPurchase: inv.thirdPartyPurchase,
          },
        });
      }
    }

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
        taskInventories: true,
      },
    });
  }

 async addCustomerRemark(taskId: number, dto: {
  remark: string;
  status?: string;
  createdBy: string;
}) {
  const task = await this.prisma.task.findUnique({
    where: { id: taskId },
    include: {
      remarks: {
        orderBy: { id: 'desc' },
        take: 1,
      },
    },
  });

  if (!task) {
    throw new NotFoundException('Task not found');
  }

  const lastStatus = task.remarks.length
    ? task.remarks[0].status
    : 'Open';

  // 🔒 CUSTOMER RULE
  let finalStatus = lastStatus;

  // ✅ ONLY allow Reopen if task is Completed
  if (
    lastStatus === 'Completed' &&
    dto.status === 'Reopen'
  ) {
    finalStatus = 'Reopen';
  }

  // 🚫 Any other status change from customer is ignored

  return this.prisma.tasksRemarks.create({
    data: {
      taskId,
      remark: dto.remark,
      status: finalStatus,   // 🔥 THIS IS THE FIX
      createdBy: dto.createdBy,
    },
  });
}



  async findByCustomer(customerId: number) {
  return this.prisma.task.findMany({
    where: {
      addressBookId: customerId,
    },
    include: {
      department: true,
      addressBook: true,
      site: true,
      contacts: true,
      workscopeCat: true,
      workscopeDetails: true,
      schedule: true,
      remarks: true,
      taskInventories: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async findByCustomers(customerIds: number[]) {
  if (!customerIds?.length) return [];

  return this.prisma.task.findMany({
    where: {
      addressBookId: {
        in: customerIds,
      },
    },
    include: {
      department: true,
      addressBook: true,
      site: true,
      contacts: true,
      workscopeCat: true,
      workscopeDetails: true,
      schedule: true,
      remarks: true,
      taskInventories: true,
    },
    orderBy: { createdAt: 'desc' },
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
        taskInventories: true,
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
        taskInventories: true,
      },
    });

    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, dto: UpdateTaskDto) {
    await this.findOne(id);

    const { 
      contacts, 
      workscopeDetails, 
      schedule, 
      remarks, 
      taskInventories,
      ...updateData 
    } = dto as any;

    // --- UPDATE MAIN TASK ---
    await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    // --- CONTACTS ---
    await this.prisma.tasksContacts.deleteMany({ where: { taskId: id } });
    if (contacts?.length) {
      await this.prisma.tasksContacts.createMany({
        data: contacts.map((c: any) => ({
          taskId: id,
          contactName: c.contactName,
          contactNumber: c.contactNumber,
          contactEmail: c.contactEmail,
        })),
      });
    }

    // --- WORKSCOPE DETAILS ---
    await this.prisma.tasksWorkscopeDetails.deleteMany({ where: { taskId: id } });
    if (workscopeDetails?.length) {
      await this.prisma.tasksWorkscopeDetails.createMany({
        data: workscopeDetails.map((d: any) => ({
          taskId: id,
          workscopeCategoryId: parseInt(d.workscopeCategoryId),
          workscopeDetails: d.workscopeDetails,
          extraNote: d.extraNote,
        })),
      });
    }

    // --- SCHEDULE ---
    await this.prisma.tasksSchedule.deleteMany({ where: { taskId: id } });
    if (schedule?.length) {
      await this.prisma.tasksSchedule.createMany({
        data: schedule.map((s: any) => ({
          taskId: id,
          proposedDateTime: new Date(s.proposedDateTime),
          priority: s.priority,
        })),
      });
    }

    // --- INVENTORY UPDATE (delete + recreate) ---
    await this.prisma.taskInventory.deleteMany({ where: { taskId: id } });

    if (taskInventories?.length) {
      for (const inv of taskInventories) {
        await this.prisma.taskInventory.create({
          data: {
            taskId: id,
            serviceContractId: inv.serviceContractId,
            productTypeId: inv.productTypeId,
            makeModel: inv.makeModel,
            snMac: inv.snMac,
            description: inv.description,
            purchaseDate: new Date(inv.purchaseDate),
            warrantyPeriod: inv.warrantyPeriod,
            warrantyStatus: inv.warrantyStatus,
            thirdPartyPurchase: inv.thirdPartyPurchase,
          },
        });
      }
    }

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
        taskInventories: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}
