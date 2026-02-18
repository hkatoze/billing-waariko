import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return { message: 'Waariko Billing Service' };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'billing-service',
      timestamp: new Date().toISOString(),
    };
  }
}
