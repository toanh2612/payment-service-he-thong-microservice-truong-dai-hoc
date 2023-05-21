import { Global, Module } from "@nestjs/common";
import { CustomConfigModule } from "./common/configs/config.module";
import { PaymentModule } from "./modules/payment/payment.module";
@Global()
@Module({
  imports: [CustomConfigModule, PaymentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
