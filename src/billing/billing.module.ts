import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [ClientsModule, ProjectsModule]
})
export class BillingModule {}
