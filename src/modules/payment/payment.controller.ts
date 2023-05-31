import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from "@nestjs/common";
import { parseQuery } from "src/common/utils/utils";
import { GetPaymentListFilterDto } from "./dto/GetPaymentListFilter.dto";
import PaymentService from "./payment.service";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { FilterOptionsType } from "src/common/types/FilterOptions.type";
import { QueryCommonDto } from "src/common/dto/QueryCommon.dto";
import { OrderType } from "src/common/types/Order.type";
import { CreatePaymentDto } from "./dto/CreatePayment.dto";
import { UpdatePaymentDto } from "./dto/UpdatePayment.dto";
import { Response } from "express";

@Controller("/payment")
@ApiTags("payment")
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiQuery({ name: "filter", type: GetPaymentListFilterDto })
  @ApiQuery({ name: "filterOptions" })
  @ApiQuery({ name: "perPage", required: false })
  @ApiQuery({ name: "page", required: false })
  @Get("/me")
  async getMyList(
    @Res() response: Response,
    @Query() query: QueryCommonDto<GetPaymentListFilterDto>
  ) {
    query = parseQuery(query);

    const order: OrderType = query.order;
    const page = query.page;
    const perPage = query.perPage;
    const filterOptions: FilterOptionsType = query.filterOptions;
    const filter: GetPaymentListFilterDto = query.filter;
    const user: any = response.locals.user;
    return await this.paymentService
      .getMyList(user, filter, order, page, perPage, filterOptions)
      .then((result: any) => {
        return response.json({
          ...result,
        });
      })
      .catch((error) => {
        response.statusCode = Number(error["httpStatusCode"] || 500);
        response.json({ error });
      });
  }

  @Get("/:id")
  async getOne(@Param("id") id: string) {
    return await this.paymentService.getOne(id);
  }

  @ApiQuery({ name: "filter", type: GetPaymentListFilterDto })
  @ApiQuery({ name: "filterOptions" })
  @ApiQuery({ name: "perPage", required: false })
  @ApiQuery({ name: "page", required: false })
  @Get("/")
  async getList(@Query() query: QueryCommonDto<GetPaymentListFilterDto>) {
    query = parseQuery(query);

    const order: OrderType = query.order;
    const page = query.page;
    const perPage = query.perPage;
    const filterOptions: FilterOptionsType = query.filterOptions;
    const filter: GetPaymentListFilterDto = query.filter;
    return await this.paymentService.getList(
      filter,
      order,
      page,
      perPage,
      filterOptions
    );
  }

  @Post("/")
  async create(@Body() createPaymentBody: CreatePaymentDto) {
    return await this.paymentService.create(createPaymentBody);
  }

  @Put("/:id")
  async update(
    @Res() response: Response,
    @Param("id") id: string,
    @Body() updatePaymentBody: UpdatePaymentDto
  ) {
    const { status } = updatePaymentBody;
    const user: any = response.locals.user;
    await this.paymentService
      .updateStatus(id, status, user)
      .then((result) => {
        return response.json({
          ...result,
        });
      })
      .catch((error) => {
        response.statusCode = Number(error["httpStatusCode"] || 500);
        response.json({ error });
      });
  }
}
