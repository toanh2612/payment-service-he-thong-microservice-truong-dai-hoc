import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { WinstonModule } from "nest-winston";

import { transports, format } from "winston";
import "winston-daily-rotate-file";
import { AppModule } from "./app.module";
import { CONFIG } from "./common/configs/config";
import { initializeTransactionalContext } from "typeorm-transactional-cls-hooked";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import RabbitMQService from "./modules/rabbitMQ/rabbitMQ.service";
import { CONSTANT } from "./common/utils/constant";

process.on("unhandledRejection", (error) => {
  Logger.error(error);
});

process.on("uncaughtException", (error) => {
  Logger.error(error);
});

async function bootstrap() {
  const httpServer = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new transports.DailyRotateFile({
          filename: `logs/%DATE%-error.log`,
          level: "error",
          format: format.combine(format.timestamp(), format.json()),
          datePattern: "YYYY-MM-DD",
          zippedArchive: false,
          maxFiles: "30d",
        }),
        new transports.DailyRotateFile({
          filename: `logs/%DATE%-combined.log`,
          format: format.combine(format.timestamp(), format.json()),
          datePattern: "YYYY-MM-DD",
          zippedArchive: false,
          maxFiles: "30d",
        }),
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.printf((info) => {
              return `${info.timestamp} ${info.level}: ${info.message}`;
            }),
            format.colorize({
              all: true,
            })
          ),
        }),
      ],
    }),
  });

  httpServer.useGlobalPipes(new ValidationPipe({}));

  httpServer.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: true,
    })
  );
  httpServer.useGlobalFilters(
    new AllExceptionsFilter(httpServer.get(HttpAdapterHost))
  );
  httpServer.enableCors();
  const config = new DocumentBuilder()
    .setTitle(`${CONFIG["HOST"]} API`)
    .setDescription(`${CONFIG["HOST"]} API`)
    .setVersion("1.0")
    .addTag(`${CONFIG["HOST"]} API`)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(httpServer, config);
  SwaggerModule.setup("/docs", httpServer, document);
  await httpServer.init();
  const rabbitMQService = httpServer.get(RabbitMQService);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.REDIS,
      options: {
        password: CONFIG["REDIS_CLIENT_PASSWORD"],
        port: Number(CONFIG["REDIS_CLIENT_PORT"]),
        host: CONFIG["REDIS_CLIENT_HOST"],
        retryAttempts: 5,
        retryDelay: 5000,
        db: 0,
      },
    });
  await Promise.all([
    microservice.listen().then(() => {
      Logger.log("Start microservice");
    }),
    httpServer.listen(
      Number(CONFIG["APP_PORT"]),
      CONFIG["APP_HOST"],
      async () => {
        Logger.log("Start HTTP server");
      }
    ),
    rabbitMQService.receiver(CONSTANT.RABBITMQ.EXCHANGE_NAME, [
      CONSTANT.EVENT.SCHEDULE.REGISTER_CLASSROOMS,
    ]),
  ]);
}

initializeTransactionalContext();
bootstrap();
