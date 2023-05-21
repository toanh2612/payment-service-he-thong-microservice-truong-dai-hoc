import _ from "lodash";
import { CONSTANT } from "../utils/constant";
export class SystemError extends Error {
  private code: string = CONSTANT.ERROR.E0000.code;
  private httpStatusCode: number = CONSTANT.ERROR.E0000.httpStatusCode;
  private customStack: unknown | undefined = undefined;
  constructor(errorOptions: any) {
    super();
    errorOptions = _.pick(errorOptions, ["message", "code", "httpStatusCode"]);
    this.message = errorOptions["message"] || CONSTANT.ERROR.E0000.message;
    this.code = errorOptions["code"] || this.code;
    this.httpStatusCode = errorOptions["httpStatusCode"] || this.httpStatusCode;
    this.customStack = this.stack ? this.stack.toString() : this.customStack;
  }
}
