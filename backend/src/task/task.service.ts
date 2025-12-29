import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MailerService } from '@nestjs-modules/mailer';


@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) { }

    /* --------------------------------------------------
     CUSTOMER EMAILS FROM DB (SOURCE OF TRUTH)
  -------------------------------------------------- */
  private async getCustomerEmailsByAddressBook(
    addressBookId: number,
  ): Promise<string[]> {
    const contacts = await this.prisma.customerContact.findMany({
      where: {
        sites: {
          some: {
            customerId: addressBookId,
          },
        },
      },
      select: {
        emailAddress: true,
      },
    });

    return contacts.map(c => c.emailAddress);
  }

  /* --------------------------------------------------
     CREATE TASK (INTERNAL + CUSTOMER)
  -------------------------------------------------- */
  async create(
    dto: CreateTaskDto,
    loggedInUserId?: number,
    customerInfo?: { name: string },
  ) {
    const {
      contacts,
      workscopeDetails,
      schedule,
      remarks,
      taskInventories,
      ...taskData
    } = dto as any;

    // 🔹 Generate Task ID
    const now = new Date();
    const taskID = `ENSR${String(now.getFullYear()).slice(-2)}${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(
      now.getHours(),
    ).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
      now.getSeconds(),
    ).padStart(2, '0')}`;

    const createdBy = loggedInUserId
      ? 'Internal User'
      : customerInfo?.name || 'Customer';

    // 🔹 Create Task
    const task = await this.prisma.task.create({
      data: {
        taskID,
        departmentId: dto.departmentId,
        addressBookId: dto.addressBookId,
        siteId: dto.siteId,
        status: dto.status || 'Open',
        title: dto.title,
        description: dto.description ?? null,
        userId: loggedInUserId ?? null,
        createdBy,
      },
    });

    // 🔹 First remark (customer description lives here)
    if (remarks?.length === 1) {
      await this.prisma.tasksRemarks.create({
        data: {
          taskId: task.id,
          remark: remarks[0].remark,
          status: remarks[0].status || 'Open',
          createdBy: remarks[0].createdBy || createdBy,
        },
      });
    }

    // 🔹 Reload full task for email
    const fullTask = await this.prisma.task.findUnique({
      where: { id: task.id },
      include: {
        department: { include: { emails: true } },
        addressBook: true,
        site: true,
        user: true,
        remarks: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    // 🔹 Resolve customer emails ONLY from DB
    let customerEmails: string[] = [];
    if (!loggedInUserId) {
      customerEmails = await this.getCustomerEmailsByAddressBook(
        dto.addressBookId,
      );
    }

await this.sendTaskCreatedEmail(fullTask);

    return fullTask;
  }

  /* --------------------------------------------------
     EMAIL BODY BUILDERS
  -------------------------------------------------- */
  private buildInternalEmail(task: any): string {
    const description =
      task.description || task.remarks?.[0]?.remark || 'N/A';

    return `
New Task Created (Internal)

Task ID:
${task.taskID}

Created By:
${task.user?.fullName || task.createdBy}

Department:
${task.department?.departmentName}

Customer:
${task.addressBook?.customerName}

Site:
${task.site?.siteName}

Description:
${description}

---
Internal Notification
`;
  }

  private buildCustomerEmail(task: any): string {
    const description =
      task.description || task.remarks?.[0]?.remark || 'N/A';

    return `
Your request has been registered successfully.

Task ID:
${task.taskID}

Department:
${task.department?.departmentName}

Description:
${description}

We will contact you shortly.

---
Support Team
`;
  }

  /* --------------------------------------------------
     EMAIL SENDER (FIXED LOGIC)
  -------------------------------------------------- */
  private async sendTaskCreatedEmail(task: any) {
  // 1️⃣ Department emails (ALWAYS)
  const departmentEmails =
    task.department?.emails?.map(e => e.email) || [];

  // 2️⃣ Internal creator email
  const internalCreatorEmail =
    task.user?.email ? [task.user.email] : [];

  // 3️⃣ Customer emails (resolved from DB)
  const customerEmails = await this.getCustomerEmailsByAddressBook(
    task.addressBookId,
  );

  // 4️⃣ Merge recipients
  const recipients = Array.from(
    new Set([
      ...departmentEmails,
      ...(task.userId ? internalCreatorEmail : customerEmails),
    ]),
  );

  if (!recipients.length) {
    console.warn('⚠️ No recipients resolved for task', task.taskID);
    return;
  }

  // 5️⃣ Description fallback (remark → description)
  const description =
    task.description ||
    task.remarks?.[0]?.remark ||
    'N/A';

  // 6️⃣ Email body
  const subject = `New Task Created - ${task.taskID}`;

  const body = task.userId
    ? `
New Task Created (Internal)

Task ID:
${task.taskID}

Created By:
${task.user?.fullName} (${task.user?.username})

Department:
${task.department?.departmentName}

Customer:
${task.addressBook?.customerName}

Site:
${task.site?.siteName}

Description:
${description}

---
System Notification
`
    : `
Your request has been registered successfully.

Task ID:
${task.taskID}

Department:
${task.department?.departmentName}

Description:
${description}

We will contact you shortly.

---
Support Team
`;

  await this.mailerService.sendMail({
    to: recipients,
    subject,
    text: body,
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
