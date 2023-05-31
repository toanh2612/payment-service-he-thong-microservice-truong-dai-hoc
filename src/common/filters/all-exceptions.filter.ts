import {
  Catch,
  ArgumentsHost,
  HttpAdapterHost,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { ExceptionFilter } from "@nestjs/common";
import { QueryFailedError, TypeORMError } from "typeorm";
import { v4 } from "uuid";
import _ from "lodash";
import { CONSTANT } from "../utils/constant";
import { CONFIG } from "../configs/config";

@Catch(HttpException, QueryFailedError, TypeORMError)
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: unknown, host: ArgumentsHost): void {
    const requestId = v4();
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // const request = ctx.getRequest<Request>();
    let exceptionResponse: any;
    let httpStatusCode: HttpStatus =
      CONSTANT.ERROR.SYSTEM.GENERAL_ERROR.httpStatusCode;
    let message: string = CONSTANT.ERROR.SYSTEM.GENERAL_ERROR.message;
    let code: string = CONSTANT.ERROR.SYSTEM.GENERAL_ERROR.code;
    let stack: unknown | undefined;

    if (
      exception instanceof HttpException &&
      exception.hasOwnProperty("response") &&
      exception["response"].hasOwnProperty("cause")
    ) {
      exceptionResponse = _.pick(exception["response"]["cause"], [
        "code",
        "message",
        "httpStatusCode",
        "statusCode",
        "customStack",
      ]);
      httpStatusCode =
        exceptionResponse["httpStatusCode"] ||
        exceptionResponse["statusCode"] ||
        httpStatusCode;
      message = exceptionResponse["message"] || message;
      code = exceptionResponse["code"] || code;
      stack = exceptionResponse["customStack"]
        ? exceptionResponse["customStack"].toString()
        : stack;
    } else if (
      exception instanceof HttpException &&
      exception.hasOwnProperty("response")
    ) {
      exceptionResponse = _.pick(exception["response"], [
        "code",
        "message",
        "httpStatusCode",
        "statusCode",
        "customStack",
      ]);
      httpStatusCode =
        exceptionResponse["httpStatusCode"] ||
        exceptionResponse["statusCode"] ||
        httpStatusCode;
      message = exceptionResponse["message"] || message;
      code = exceptionResponse["code"] || code;
      stack = exceptionResponse["customStack"]
        ? exceptionResponse["customStack"].toString()
        : stack;
    }

    if (CONFIG["NODE_ENV"] === "development") {
    }

    const responseBody = {
      requestId,
      // httpStatusCode,
      error: {
        code,
        message,
        stack,
      },
    };

    return httpAdapter.reply(response, responseBody, httpStatusCode);
  }
}
