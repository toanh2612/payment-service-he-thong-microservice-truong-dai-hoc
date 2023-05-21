import { ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";

@Exclude()
export class GetPaymentListFilterDto {
	@ApiPropertyOptional()
	@Expose()
	@IsString()
	id: string | null;

	@ApiPropertyOptional()
	@Expose()
	@IsString()
	studentId: string | null;

	@ApiPropertyOptional()
	@Expose()
	@IsString()
	status: string | null;

	@ApiPropertyOptional()
	@Expose()
	@IsString()
	paymentType: string | null;
}
