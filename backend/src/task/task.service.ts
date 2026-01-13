import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  addressBookId: number | null,
): Promise<string[]> {

  if (!addressBookId) {
    return []; // 🔥 inquiry without customer
  }

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

  return contacts
    .map(c => c.emailAddress)
    .filter(Boolean);
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
      purchase,              // 🔥 NEW
      taskType,              // 🔥 NEW
      purchaseAttachments,   // 🔥 NEW for attachments
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

    return this.prisma.$transaction(async (tx) => {

      // 🔹 Create Task
      const task = await tx.task.create({
        data: {
          taskID,
          departmentId: dto.departmentId,
          addressBookId: dto.addressBookId,
          siteId: dto.siteId,
          status: dto.status || 'Open',
          title: dto.title,
          description: dto.description ?? null,
          attachment: dto.attachment ?? null,
          priority: dto.priority ?? null,
          userId: loggedInUserId ?? null,
          createdBy,
          taskType: taskType ?? 'SERVICE',
        },
      });

      // 🔹 First remark
      if (remarks?.length === 1) {
        await tx.tasksRemarks.create({
          data: {
            taskId: task.id,
            remark: remarks[0].remark,
            status: remarks[0].status || 'Open',
            createdBy: remarks[0].createdBy || createdBy,
          },
        });
      }

      // 🔹 PURCHASE LOGIC (ONLY if present)
      if (purchase) {
        const taskPurchase = await tx.taskPurchase.create({
          data: {
            taskId: task.id,
            purchaseType: purchase.purchaseType,
            customerName: purchase.customerName,
            address: purchase.address,
          },
        });

        // Validate and create products
        for (const product of purchase.products || []) {
          // 🔒 Rule enforcement
          if (
            purchase.purchaseType === purchase.ORDER &&
            (product.validity || product.availability)
          ) {
            throw new BadRequestException(
              'Validity / availability not allowed for Purchase Order',
            );
          }

          await tx.taskPurchaseProduct.create({
            data: {
              taskPurchaseId: taskPurchase.id,
              make: product.make,
              model: product.model,
              description: product.description,
              warranty: product.warranty,
              rate: product.rate,
              vendor: product.vendor,
              validity: product.validity ? new Date(product.validity) : null,
              availability: product.availability,
            },
          });
        }

        // 🔹 Handle attachments if provided
        if (purchaseAttachments?.length) {
          for (const attachment of purchaseAttachments) {
            await tx.taskPurchaseAttachment.create({
              data: {
                taskPurchaseId: taskPurchase.id,
                filename: attachment.filename,
                filepath: attachment.filepath,
                mimeType: attachment.mimeType,
                fileSize: attachment.fileSize,
              },
            });
          }
        }
      }

      // 🔹 Reload full task
      const fullTask = await tx.task.findUnique({
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
          purchase: {
            include: {
              products: true,
              taskPurchaseAttachments: true, // 🔥 NEW
            },
          },
        },
      });

      await this.sendTaskCreatedEmail(fullTask);

      return fullTask;
    });
  }


  async addPurchaseAttachment(taskId: number, file: Express.Multer.File) {
  const purchase = await this.prisma.taskPurchase.findUnique({
    where: { taskId },
  });

  if (!purchase) {
    throw new BadRequestException('Purchase record not found');
  }

  return this.prisma.taskPurchaseAttachment.create({
    data: {
      taskPurchaseId: purchase.id,
      filename: file.originalname,
      filepath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
    },
  });
}


  /* --------------------------------------------------
     EMAIL BODY BUILDERS
  -------------------------------------------------- */
private buildInternalEmail(task: any): string {
  const description =
    task.description || task.remarks?.[0]?.remark || 'N/A';
  
  // Fallback to purchase data if addressBook/site are null
  const customerName = task.addressBook?.customerName || task.purchase?.customerName || 'N/A';
  const siteName = task.site?.siteName || task.purchase?.address || 'N/A';

  return `
New Task Created (Internal)

Task ID:
${task.taskID}

Created By:
${task.user?.fullName || task.createdBy}

Department:
${task.department?.departmentName}

Customer:
${customerName}

Site:
${siteName}

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

  // 3️⃣ Customer emails - check both sources
  let customerEmails: string[] = [];
  
  if (task.addressBookId) {
    // Use DB contacts if addressBookId exists
    customerEmails = await this.getCustomerEmailsByAddressBook(task.addressBookId);
  } else if (task.purchase?.customerName) {
    // If no addressBookId but purchase has customer, check if we have customer email in purchase
    // You might need to adjust this based on your purchase data structure
    // For now, we'll use the internal creator email for notification
    customerEmails = internalCreatorEmail;
  }

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

  // 6️⃣ Customer and Site info fallback
  const customerName = task.addressBook?.customerName || task.purchase?.customerName || 'N/A';
  const siteName = task.site?.siteName || task.purchase?.address || 'N/A';

  // 7️⃣ Email body
  const title = task.title ? task.title.trim() : 'No Title';

  const subject = `ENPL | SUPPORT TICKET | - ${task.taskID} | ${title}`;

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
${customerName}

Site:
${siteName}

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

   // 🔒 CUSTOMER STATUS RULES
let finalStatus = lastStatus;

const allowedCustomerStatuses = ['Completed', 'Reopen'];

// ✅ Allow status change ONLY if requested status is allowed
if (dto.status && allowedCustomerStatuses.includes(dto.status)) {
  finalStatus = dto.status;
}

    return this.prisma.tasksRemarks.create({
      data: {
        taskId,
        remark: dto.remark,
        status: finalStatus,   
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
      purchase: { 
        include: { 
          products: true,
          taskPurchaseAttachments: true
        } 
      },
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
        purchase: { include: {
          products: true,
          taskPurchaseAttachments: true
          } }, // 🔥 NEW
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
      purchase,              // 🔥 NEW
      purchaseAttachments,   // 🔥 NEW
      ...updateData
    } = dto as any;

    return this.prisma.$transaction(async (tx) => {

      // --- UPDATE MAIN TASK ---
      await tx.task.update({
        where: { id },
        data: updateData,
      });

      // --- CONTACTS ---
      await tx.tasksContacts.deleteMany({ where: { taskId: id } });
      if (contacts?.length) {
        await tx.tasksContacts.createMany({
          data: contacts.map((c: any) => ({
            taskId: id,
            contactName: c.contactName,
            contactNumber: c.contactNumber,
            contactEmail: c.contactEmail,
          })),
        });
      }

      // --- WORKSCOPE DETAILS ---
      await tx.tasksWorkscopeDetails.deleteMany({ where: { taskId: id } });
      if (workscopeDetails?.length) {
        await tx.tasksWorkscopeDetails.createMany({
          data: workscopeDetails.map((d: any) => ({
            taskId: id,
            workscopeCategoryId: parseInt(d.workscopeCategoryId),
            workscopeDetails: d.workscopeDetails,
            extraNote: d.extraNote,
          })),
        });
      }

      // --- SCHEDULE ---
      await tx.tasksSchedule.deleteMany({ where: { taskId: id } });
      if (schedule?.length) {
        await tx.tasksSchedule.createMany({
          data: schedule.map((s: any) => ({
            taskId: id,
            proposedDateTime: new Date(s.proposedDateTime),
            priority: s.priority,
          })),
        });
      }

      // --- INVENTORY ---
      await tx.taskInventory.deleteMany({ where: { taskId: id } });
      if (taskInventories?.length) {
        for (const inv of taskInventories) {
          await tx.taskInventory.create({
            data: {
              taskId: id,
              serviceContractId: inv.serviceContractId,
              productTypeId: inv.productTypeId,
              makeModel: inv.makeModel,
              snMac: inv.snMac,
              description: inv.description,
              purchaseDate: inv.purchaseDate
                ? new Date(inv.purchaseDate)
                : null,
              warrantyPeriod: inv.warrantyPeriod,
              warrantyStatus: inv.warrantyStatus,
              thirdPartyPurchase: inv.thirdPartyPurchase,
            },
          });
        }
      }

      // 🔥 PURCHASE UPDATE / CREATE
      if (purchase) {
        // 🔒 VALIDATE UPDATE RULES
        if (purchase.products !== undefined && purchase.products.length === 0) {
          throw new BadRequestException(
            'Products cannot be empty if provided'
          );
        }

        // Validate product rules for ORDER type
        if (purchase.products) {
          for (const product of purchase.products) {
            if (
              purchase.purchaseType === purchase.ORDER &&
              (product.validity || product.availability)
            ) {
              throw new BadRequestException(
                'Validity / availability not allowed for Purchase Order'
              );
            }
          }
        }

        let taskPurchase = await tx.taskPurchase.findUnique({
          where: { taskId: id },
        });

        if (!taskPurchase) {
          taskPurchase = await tx.taskPurchase.create({
            data: {
              taskId: id,
              purchaseType: purchase.purchaseType,
              customerName: purchase.customerName,
              address: purchase.address,
            },
          });
        } else {
          await tx.taskPurchase.update({
            where: { id: taskPurchase.id },
            data: {
              purchaseType: purchase.purchaseType,
              customerName: purchase.customerName,
              address: purchase.address,
            },
          });
        }

        // Update products if provided
        if (purchase.products) {
          await tx.taskPurchaseProduct.deleteMany({
            where: { taskPurchaseId: taskPurchase.id },
          });

          for (const product of purchase.products) {
            await tx.taskPurchaseProduct.create({
              data: {
                taskPurchaseId: taskPurchase.id,
                make: product.make,
                model: product.model,
                description: product.description,
                warranty: product.warranty,
                rate: product.rate,
                vendor: product.vendor,
                validity: product.validity ? new Date(product.validity) : null,
                availability: product.availability,
              },
            });
          }
        }

       
      }

      return tx.task.findUnique({
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
          purchase: {
            include: {
              products: true,
              taskPurchaseAttachments: true, // 🔥 NEW
            },
          },
        },
      });
    });
  }


  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}
