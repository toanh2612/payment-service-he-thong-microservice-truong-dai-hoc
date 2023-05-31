import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";

@Exclude()
export class UpdatePaymentDto {
  @ApiProperty()
  @Expose()
  @IsString()
  status: string;
}
