import { Module } from '@nestjs/common';
import { SitesService } from './site.service';
import { SitesController } from './site.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SitesController],
  providers: [SitesService, PrismaService],
})
export class SitesModule {}
