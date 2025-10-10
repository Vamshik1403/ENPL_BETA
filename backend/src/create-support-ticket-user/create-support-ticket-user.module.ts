import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupportTicketUsersController } from './create-support-ticket-user.controller';
import { SupportTicketUsersService } from './create-support-ticket-user.service';


@Module({
  controllers: [SupportTicketUsersController],
  providers: [SupportTicketUsersService,PrismaService],
})
export class CreateSupportTicketUserModule {}
