import { ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsBoolean, IsString } from "class-validator";

@Exclude()
export class UpdatePaymentDto {
	@ApiPropertyOptional()
	@Expose()
	@IsBoolean()
	isRead: boolean;

	@ApiPropertyOptional()
	@Expose()
	@IsString()
	content: string;
}
