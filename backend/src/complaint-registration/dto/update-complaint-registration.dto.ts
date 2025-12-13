import { PartialType } from '@nestjs/mapped-types';
import { CreateComplaintRegistrationDto } from './create-complaint-registration.dto';

export class UpdateComplaintRegistrationDto extends PartialType(CreateComplaintRegistrationDto) {}
