import { Injectable, Scope } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { PaymentEntity } from "src/common/entities/payment.entity";
import { DataSource } from "typeorm";
import {
  addOrderBy,
  addWhere,
  generateRandomCode,
} from "src/common/utils/utils";
import { IPayment } from "./interfaces/IPayment.interface";
import { v4 } from "uuid";
import { CONSTANT } from "src/common/utils/constant";
import EventEmitterService from "../eventEmitter/evenEmitter.service";
import EventStoreService from "../eventStore/eventStore.service";
import { PaymentDetailEntity } from "src/common/entities/PaymentDetail.entity";

@Injectable({ scope: Scope.DEFAULT })
export default class PaymentService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly eventStoreService: EventStoreService,
    private readonly eventEmitterService: EventEmitterService
  ) {
    this.eventEmitterService
      .get()
      .on(
        CONSTANT.EVENT.SCHEDULE.REGISTER_CLASSROOM_INIT,
        this.registerClassroomInitEvent.bind(this)
      );
    this.eventEmitterService
      .get()
      .on(
        CONSTANT.EVENT.SCHEDULE.CANCEL_CLASSROOM,
        this.cancelClassroomsEvent.bind(this)
      );
  }

  async getList(
    filter: any,
    order: any,
    page: number,
    perPage: number,
    filterOptions?: any
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        filterOptions = filterOptions || {};
        const relativeFields: string[] = [];

        let getPaymentListQuery = await this.dataSource
          .getRepository(PaymentEntity)
          .createQueryBuilder("payment")
          // .leftJoinAndSelect("", "")
          .skip((page - 1) * perPage)
          .take(perPage);

        getPaymentListQuery = addWhere(
          getPaymentListQuery,
          filter,
          relativeFields
        );
        getPaymentListQuery = addOrderBy(getPaymentListQuery, order);

        const paymentFoundList: IPayment[] =
          await getPaymentListQuery.getMany();
        const paymentFoundCount: number = await getPaymentListQuery.getCount();

        return resolve({
          result: paymentFoundList,
          paging: {
            page,
            perPage,
            total: paymentFoundCount,
          },
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  async getOne(id: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const paymentFound: any = await this.dataSource
          .getRepository(PaymentEntity)
          .createQueryBuilder("payment")
          .leftJoinAndSelect("payment.paymentDetails", "paymentDetails")
          .where(`payment.id = :id`, {
            id,
          })
          .getOne();

        return resolve({
          result: paymentFound,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  async create(createPaymentData: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return new Promise(async (resolve, reject) => {
      try {
        let newPaymentData = await queryRunner.manager
          .getRepository(PaymentEntity)
          .create(createPaymentData);

        const newPaymentDataSave: any = await queryRunner.manager
          .getRepository(PaymentEntity)
          .save(newPaymentData);

        await queryRunner.commitTransaction();
        await queryRunner.release();

        const newPaymentFound = await this.dataSource
          .getRepository(PaymentEntity)
          .createQueryBuilder("payment")
          .where("payment.id = :id", {
            id: newPaymentDataSave.id,
          })
          .andWhere("payment.is_deleted = false")
          .orderBy("payment.created_date", "DESC")
          .getOne();

        return resolve({
          result: newPaymentFound,
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();

        return reject(error);
      }
    });
  }

  async update(id: string, updatePaymentData: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return new Promise(async (resolve, reject) => {
      try {
        let paymentFound = await queryRunner.manager
          .getRepository(PaymentEntity)
          .createQueryBuilder("payment")
          .where("payment.id = :id", {
            id: id,
          })
          .andWhere("payment.is_deleted = false")
          .getOne();

        if (!paymentFound) {
          return reject({
            code: "",
            message: "",
          });
        }

        await queryRunner.manager
          .getRepository(PaymentEntity)
          .createQueryBuilder()
          .update(PaymentEntity)
          .set(updatePaymentData)
          .where("id = :id", { id: paymentFound.id })
          .execute();

        await queryRunner.commitTransaction();
        await queryRunner.release();

        paymentFound = await this.dataSource
          .getRepository(PaymentEntity)
          .createQueryBuilder("payment")
          .where("payment.id = :id", {
            id: paymentFound.id,
          })
          .andWhere("payment.is_deleted = false")
          .getOne();

        return resolve({
          result: paymentFound,
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();

        return reject(error);
      }
    });
  }

  async cancelClassroomsEvent(payload): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const classroomList = payload?.data?.classroomList;
        const student = payload?.data?.student;
        await Promise.all(
          classroomList.map(async (classroom) => {
            const { id } = classroom;
            if (!id) {
              return reject({
                code: "",
                message: `Not found classroom ${classroom.id}`,
              });
            }

            let paymentDetailFound = await queryRunner.manager
              .getRepository(PaymentDetailEntity)
              .createQueryBuilder("paymentDetail")
              .where("paymentDetail.studentId = :studentId", {
                studentId: student.id,
              })
              .andWhere("paymentDetail.classroomId = :classroomId", {
                classroomId: classroom.id,
              })
              .getOne();

            if (!paymentDetailFound) {
              return reject({
                message: `Not found classroom ${classroom.id} with student ${student.id}`,
              });
            }

            const payment = paymentDetailFound?.payment;
            let paymentFound = await queryRunner.manager
              .getRepository(PaymentEntity)
              .createQueryBuilder("payment")
              .where("payment.id = :paymentId", {
                paymentId: payment?.id,
              })
              .andWhere("payment.is_deleted = false")
              .getOne();

            if (!paymentFound) {
              return reject({
                code: "",
                message: "",
              });
            }

            await queryRunner.manager
              .getRepository(PaymentEntity)
              .createQueryBuilder()
              .update(PaymentEntity)
              .set({
                status: CONSTANT.ENTITY.PAYMENT.STATUS.REFUND,
              })
              .where("id = :id", { id: paymentFound.id })
              .execute();
          })
        );

        await queryRunner.commitTransaction();
        await queryRunner.release();

        return resolve({
          result: {
            payload,
          },
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject(error);
      }
    });
  }

  async registerClassroomInitEvent(payload): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const compensationId: string = payload?.data?.compensationId;

        let newPayment = {
          code: generateRandomCode(),
          studentId: payload?.data?.user?.id,
          paymentType: CONSTANT.ENTITY.PAYMENT.PAYMENT_TYPE.ZALO_PAY,
          status: CONSTANT.ENTITY.PAYMENT.STATUS.INIT,
        };

        await queryRunner.manager.getRepository(PaymentEntity).save(newPayment);
        await this.eventStoreService.commit(
          compensationId,
          null,
          newPayment,
          CONSTANT.EVENT_STORE.ENTITY_TYPE.PAYMENT
        );

        await queryRunner.commitTransaction();
        await queryRunner.release();

        return resolve({
          result: {
            payload,
          },
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject(error);
      }
    });
  }
}
