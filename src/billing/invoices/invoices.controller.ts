import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';

@Controller('invoices')
export class InvoicesController {
  @Get()
  findAll(
    @Headers('x-company-id') companyId: string,
    @Headers('x-user') user: any,
  ) {
    if (!companyId) {
      throw new UnauthorizedException('Missing companyId');
    }

    if (!user || !user.companies) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasAccess = user.companies.some(
      (c: any) => c.companyId === companyId,
    );

    if (!hasAccess) {
      throw new UnauthorizedException('Access denied to this company');
    }

    return {
      message: 'Invoices fetched successfully',
      companyId,
    };
  }
}
