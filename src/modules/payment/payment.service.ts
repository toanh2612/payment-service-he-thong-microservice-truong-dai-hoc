import { Injectable, Scope } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { PaymentEntity } from "src/common/entities/payment.entity";
import { DataSource } from "typeorm";
const PromiseBlueBird = require("bluebird");
import {
  addOrderBy,
  addWhere,
  generateRandomCode,
} from "src/common/utils/utils";
import { IPayment } from "./interfaces/IPayment.interface";
import { CONSTANT } from "src/common/utils/constant";
import EventEmitterService from "../eventEmitter/evenEmitter.service";
import EventStoreService from "../eventStore/eventStore.service";
import RabbitMQService from "../rabbitMQ/rabbitMQ.service";
import { PaymentDetailEntity } from "src/common/entities/PaymentDetail.entity";

@Injectable({ scope: Scope.DEFAULT })
export default class PaymentService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly eventStoreService: EventStoreService,
    private readonly eventEmitterService: EventEmitterService,
    private readonly rabbitMQService: RabbitMQService
  ) {
    this.eventEmitterService
      .get()
      .on(
        CONSTANT.EVENT.SCHEDULE.REGISTER_CLASSROOMS,
        this.registerClassroomsEventHandler.bind(this)
      );
  }

  async getMyList(
    student,
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
          .leftJoinAndSelect("payment.paymentDetails", "paymentDetails")
          .where("payment.student_id = :studentId", {
            studentId: student.id,
          })
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

  async updateStatus(id: string, status: string, student): Promise<any> {
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
          .getOne();

        if (!paymentFound) {
          return reject(CONSTANT.ERROR.PAYMENT.NOT_FOUND);
        }

        if (
          paymentFound.status !==
          CONSTANT.ENTITY.PAYMENT.STATUS.AWAITTING_PAYMENT
        ) {
          return reject(CONSTANT.ERROR.PAYMENT.UPDATE_STATUS);
        }

        const { compensationId } = paymentFound;

        await queryRunner.manager
          .getRepository(PaymentEntity)
          .createQueryBuilder()
          .update(PaymentEntity)
          .set({ status })
          .where("id = :id", { id: paymentFound.id })
          .execute();

        await queryRunner.commitTransaction();
        await queryRunner.release();

        const paymentUpdatedFound = await this.dataSource
          .getRepository(PaymentEntity)
          .createQueryBuilder("payment")
          .where("payment.id = :id", {
            id: paymentFound.id,
          })
          .getOne();

        const paymentDetailList = await this.dataSource
          .getRepository(PaymentDetailEntity)
          .createQueryBuilder("paymentDetail")
          .where("paymentDetail.payment_id = :paymentId", {
            paymentId: paymentFound.id,
          })
          .getMany();

        const classroomList = paymentDetailList.map((paymentDetail) => {
          return paymentDetail.classroom;
        });
        await this.eventStoreService.commit(
          compensationId,
          paymentFound,
          paymentUpdatedFound,
          "PAYMENT"
        );

        switch (status) {
          case CONSTANT.ENTITY.PAYMENT.STATUS.FINISHED:
            await this.rabbitMQService.sendToQueue(
              CONSTANT.EVENT.PAYMENT.PAYMENT_SUCCESSED,
              {
                payment: paymentFound,
                compensationId,
                classroomList,
                student,
              }
            );
            break;
          case CONSTANT.ENTITY.PAYMENT.STATUS.FAILED:
            await this.rabbitMQService.sendToQueue(
              CONSTANT.EVENT.PAYMENT.PAYMENT_FAILED,
              {
                payment: paymentFound,
                compensationId,
                classroomList,
                student,
              }
            );
            break;
          case CONSTANT.ENTITY.PAYMENT.STATUS.CANCELED:
            await this.rabbitMQService.sendToQueue(
              CONSTANT.EVENT.PAYMENT.PAYMENT_CANCELED,
              {
                payment: paymentFound,
                compensationId,
                classroomList,
                student,
              }
            );
            break;
          default:
            break;
        }

        return resolve({
          result: paymentUpdatedFound,
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();

        return reject(error);
      }
    });
  }

  async registerClassroomsEventHandler(payload): Promise<any> {
    const { data } = payload;
    const { compensationId, classroomList, student, feePerCredit } = data;

    return new Promise(async (resolve, reject) => {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        let amount = 0;

        classroomList.forEach((classroom) => {
          const { subject } = classroom;
          const feePerSubject =
            Number(subject?.numberOfCredits || 0) * feePerCredit;
          amount += feePerSubject;
        });

        let newPayment = {
          code: generateRandomCode(),
          studentId: student.id,
          paymentType: CONSTANT.ENTITY.PAYMENT.PAYMENT_TYPE.ZALO_PAY,
          status: CONSTANT.ENTITY.PAYMENT.STATUS.AWAITTING_PAYMENT,
          amount: amount,
          compensationId,
        };

        const newPaymentDataSave = await queryRunner.manager
          .getRepository(PaymentEntity)
          .save(newPayment);
        await this.eventStoreService.commit(
          compensationId,
          null,
          newPayment,
          "PAYMENT"
        );

        const newPaymentFound = await queryRunner.manager
          .getRepository(PaymentEntity)
          .createQueryBuilder("payment")
          .leftJoinAndSelect("payment.paymentDetails", "paymentDetails")
          .where("payment.id = :id", {
            id: newPaymentDataSave.id,
          })
          .orderBy("payment.created_date", "DESC")
          .getOne();

        await PromiseBlueBird.each(classroomList, async (classroom) => {
          const { subject } = classroom;

          const newPaymentDetailData = {
            studentId: student?.id,
            classroomId: classroom?.id,
            paymentId: newPaymentFound?.id,
            subjectId: subject?.id,
            classroom,
            subject,
          };

          const newPaymentDetailDataSave = await queryRunner.manager
            .getRepository(PaymentDetailEntity)
            .save(newPaymentDetailData);

          const newPaymentDetailFound = await queryRunner.manager
            .getRepository(PaymentDetailEntity)
            .createQueryBuilder("paymentDetail")
            .where("paymentDetail.id = :paymentDetailId", {
              paymentDetailId: newPaymentDetailDataSave.id,
            })
            .getOne();

          await this.eventStoreService.commit(
            compensationId,
            null,
            newPaymentDetailFound,
            "PAYMENT_DETAIL"
          );
        });

        await queryRunner.commitTransaction();
        await queryRunner.release();

        await this.rabbitMQService.sendToQueue(
          CONSTANT.EVENT.PAYMENT.PAYMENT_CREATION_SUCCESSED,
          {
            payment: newPaymentFound,
            compensationId,
            student,
            classroomList,
          }
        );

        return resolve({
          result: {
            ...payload,
            compensationId,
          },
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        await this.rabbitMQService.sendToQueue(
          CONSTANT.EVENT.PAYMENT.PAYMENT_CREATION_FAILED,
          {
            compensationId,
          }
        );

        return reject(error);
      }
    });
  }
}
