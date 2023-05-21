import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsArray, IsNotEmpty } from "class-validator";

@Exclude()
export class CreatePaymentDto {
	@ApiProperty()
	@Expose()
	@IsArray()
	@IsNotEmpty()
	classroomIds: string[];
}
