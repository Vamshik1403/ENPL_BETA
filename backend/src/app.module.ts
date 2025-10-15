import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AddressBookController } from './address-book/address-book.controller';
import { AddressBookService } from './address-book/address-book.service';
import { AddressBookModule } from './address-book/address-book.module';
import { SitesModule } from './site/site.module';
import { AddressBookContactModule } from './address-book-contact/address-book-contact.module';
import { ProductTypeModule } from './product/product.module';
import { ServiceWorkCategoryModule } from './service-work-category/service-work-category.module';
import { ContractWorkCategoryModule } from './contract-work-category/contract-work-category.module';
import { WorkscopeCategoryModule } from './workscope-category/workscope-category.module';
import { ServiceContractModule } from './service-contract/service-contract.module';
import { ServiceContractPeriodModule } from './service-contract-period/service-contract-period.module';
import { ServiceContractTermsModule } from './service-contract-terms/service-contract-terms.module';
import { ServiceContractServicesModule } from './service-contract-services/service-contract-services.module';
import { ServiceContractInventoryModule } from './service-contract-inventory/service-contract-inventory.module';
import { ServiceContractHistoryModule } from './service-contract-history/service-contract-history.module';
import { DepartmentModule } from './department/department.module';
import { TaskModule } from './task/task.module';
import { TasksContactsModule } from './task-contacts/task-contacts.module';
import { TasksWorkscopeCategoryModule } from './task-workscope-category/task-workscope-category.module';
import { TasksWorkscopeDetailsModule } from './tasks-workscope-details/tasks-workscope-details.module';
import { TasksScheduleModule } from './task-schedule/task-schedule.module';
import { TasksRemarksModule } from './task-remarks/task-remarks.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { CreateSupportTicketUserModule } from './create-support-ticket-user/create-support-ticket-user.module';
import { ServiceContractTypeModule } from './service-contract-type/service-contract-type.module';
import { ServiceContractBillingModule } from './service-contract-billing/service-contract-billing.module';
import { TaskImagesModule } from './task-images/task-images.module';

@Module({
  imports: [AddressBookModule, SitesModule, AddressBookContactModule, ProductTypeModule, ServiceWorkCategoryModule, ContractWorkCategoryModule, WorkscopeCategoryModule, ServiceContractModule, ServiceContractPeriodModule, ServiceContractTermsModule, ServiceContractServicesModule, ServiceContractInventoryModule, ServiceContractHistoryModule, DepartmentModule, TaskModule, TasksContactsModule, TasksWorkscopeCategoryModule, TasksWorkscopeDetailsModule, TasksScheduleModule, TasksRemarksModule, SupportTicketsModule, CreateSupportTicketUserModule, ServiceContractTypeModule, ServiceContractBillingModule, TaskImagesModule],
  controllers: [
    AppController,
    AddressBookController,
  ],
  providers: [
    AppService,
    PrismaService,
    AddressBookService,
  ],
})
export class AppModule {}
