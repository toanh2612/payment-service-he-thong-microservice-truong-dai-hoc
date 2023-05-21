import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CONFIG } from "src/common/configs/config";
import { PaymentEntity } from "src/common/entities/payment.entity";
import { PaymentController } from "./payment.controller";
import PaymentService from "./payment.service";
import EventEmitterService from "../eventEmitter/evenEmitter.service";
import RabbitMQService from "../rabbitMQ/rabbitMQ.service";
import EventStoreService from "../eventStore/eventStore.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: CONFIG.CLIENT_MODULE.REDIS,
        transport: Transport.REDIS,
        options: {
          db: 0,
          password: CONFIG["REDIS_PASSWORD"],
          port: CONFIG["REDIS_PORT"],
          host: CONFIG["REDIS_HOST"],
        },
      },
    ]),
    TypeOrmModule.forFeature([PaymentEntity]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    EventEmitterService,
    RabbitMQService,
    EventStoreService,
  ],
})
export class PaymentModule implements NestModule {
  constructor() {}

  configure(consumer: MiddlewareConsumer) {
    return consumer;
  }
}
