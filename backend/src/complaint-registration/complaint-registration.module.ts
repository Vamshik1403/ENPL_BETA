import { Module } from '@nestjs/common';
import { ComplaintRegistrationService } from './complaint-registration.service';
import { ComplaintRegistrationController } from './complaint-registration.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ComplaintRegistrationController],
  providers: [ComplaintRegistrationService, PrismaService],
})
export class ComplaintRegistrationModule {}
