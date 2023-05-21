import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { CONFIG } from "./common/configs/config";
import { initializeTransactionalContext } from "typeorm-transactional-cls-hooked";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { CONSTANT } from "./common/utils/constant";
import RabbitMQService from "./modules/rabbitMQ/rabbitMQ.service";

process.on("unhandledRejection", (error) => {
  console.log("unhandledRejection", error);
});

process.on("uncaughtException", (error) => {
  console.log("uncaughtException", error);
});

async function bootstrap() {
  const httpServer = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle("payment.edu-microservice.site API")
    .setDescription("payment.edu-microservice.site API")
    .setVersion("1.0")
    .addTag("payment.edu-microservice.site")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(httpServer, config);
  SwaggerModule.setup("/docs", httpServer, document);
  await httpServer.init();
  const myService = httpServer.get(RabbitMQService);

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
      console.log("Start microservice");
    }),
    httpServer.listen(Number(CONFIG["APP_PORT"]), "0.0.0.0", async () => {
      console.log("Start HTTP server");
    }),
    myService.receiver(CONSTANT.RABBITMQ.EXCHANGE_NAME, [
      CONSTANT.EVENT.SCHEDULE.REGISTER_CLASSROOM_INIT,
      CONSTANT.EVENT.SCHEDULE.CANCEL_CLASSROOM,
    ]),
  ]);
}

initializeTransactionalContext();
bootstrap();
