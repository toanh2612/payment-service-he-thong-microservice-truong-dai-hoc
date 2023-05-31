import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { CONSTANT } from "src/common/utils/constant";
import UserEvent from "../user/user.event";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(UserEvent)
    private readonly userEvent: UserEvent
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const { headers } = req;
      const authorization = headers?.["authorization"];

      if (!authorization) {
        return res.json(CONSTANT.ERROR.USER.UNAUTHORIZATED);
      }

      const accessToken = authorization.split(" ")[1];

      const authResult: any = await this.userEvent.authUser(accessToken);

      res.locals.user = { ...authResult.decoded };
      return next();
    } catch (error) {
      return res.json({
        error,
      });
    }
  }
}
