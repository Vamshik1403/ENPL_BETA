import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportTicketUserDto } from './create-create-support-ticket-user.dto';
export class UpdateSupportTicketUserDto extends PartialType(CreateSupportTicketUserDto) {}