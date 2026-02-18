import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const companyId = request.headers['x-company-id'];

    if (!companyId) {
      throw new UnauthorizedException('Company header missing');
    }

    request.companyId = companyId;

    return true;
  }
}
