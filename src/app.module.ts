import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BillingModule } from './billing/billing.module';
import { InvoicesController } from './billing/invoices/invoices.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CompanyRequiredMiddleware } from './middleware/company-required.middleware';
import { InvoicesModule } from './billing/invoices/invoices.module';

@Module({
  imports: [
    BillingModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InvoicesModule,
  ],
  controllers: [AppController, InvoicesController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    // Company required
    consumer.apply(CompanyRequiredMiddleware).forRoutes('*');
  }
}
