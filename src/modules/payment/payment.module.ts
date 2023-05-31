import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CONFIG } from "src/common/configs/config";
import { PaymentEntity } from "src/common/entities/payment.entity";
import { PaymentController } from "./payment.controller";
import PaymentService from "./payment.service";
import EventEmitterService from "../eventEmitter/evenEmitter.service";
import RabbitMQService from "../rabbitMQ/rabbitMQ.service";
import EventStoreService from "../eventStore/eventStore.service";
import { AuthMiddleware } from "../auth/auth.middleware";
import UserEvent from "../user/user.event";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: CONFIG.CLIENT_MODULE.REDIS,
        transport: Transport.REDIS,
        options: {
          db: 0,
          password: CONFIG["REDIS_CLIENT_PASSWORD"],
          port: Number(CONFIG["REDIS_CLIENT_PORT"]),
          host: CONFIG["REDIS_CLIENT_HOST"],
          retryAttempts: 5,
          retryDelay: 5000,
        },
      },
    ]),
    TypeOrmModule.forFeature([PaymentEntity]),
  ],
  controllers: [PaymentController],
  providers: [
    UserEvent,
    PaymentService,
    EventEmitterService,
    RabbitMQService,
    EventStoreService,
    AuthMiddleware,
  ],
})
export class PaymentModule implements NestModule {
  constructor() {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      method: RequestMethod.ALL,
      path: "*",
    });
  }
}
