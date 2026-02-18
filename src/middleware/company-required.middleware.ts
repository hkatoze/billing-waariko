import { Injectable, NestMiddleware, ForbiddenException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import axios from "axios";

@Injectable()
export class CompanyRequiredMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Routes autorisées sans entreprise
   /*  if (
      req.originalUrl.startsWith("/auth") ||
      req.originalUrl.startsWith("/health") ||
      req.originalUrl.startsWith("/companies" )
    ) {
      return next();
    }
 */
    const user = (req as any).user;
    if (!user) return next();

    try {
      const response = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/companies/exists`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );

      if (!response.data.hasCompany) {
        throw new ForbiddenException(
          "You must create a company before using the application"
        );
      }

      next();
    } catch {
      throw new ForbiddenException(
        "You must create a company before using the application"
      );
    }
  }
}
