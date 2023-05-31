import { Injectable, Scope } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { EventEntity } from "src/common/entities/event.entity";
import { CONSTANT } from "src/common/utils/constant";
import { DataSource } from "typeorm";
const PromiseBlueBird = require("bluebird");

@Injectable({ scope: Scope.DEFAULT })
export default class EventStoreService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}
  async getEventOldestList(compensationId: string) {
    const eventOldestList = await this.dataSource
      .getRepository(EventEntity)
      .createQueryBuilder("event")
      .where({
        compensationId: compensationId,
      })
      .orderBy("event.step", "ASC")
      .getMany();

    return eventOldestList;
  }

  async commit(
    compensationId: string,
    originData: any,
    updateData: any,
    entityType: any
  ) {
    return new Promise(async (resolve, reject) => {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        let queryType: string = "";
        if (!originData && updateData) {
          queryType = CONSTANT.EVENT_STORE.QUERY_TYPE.INSERT;
        } else if (originData && updateData) {
          queryType = CONSTANT.EVENT_STORE.QUERY_TYPE.UPDATE;
        } else if (originData && !updateData) {
          queryType = CONSTANT.EVENT_STORE.QUERY_TYPE.DELETE;
        } else {
          reject("Invalid query type");
        }

        const currentStep = await this.getCurrentStep(compensationId);

        const newEventData = {
          entityType,
          queryType,
          originData,
          updateData,
          compensationId,
          step: currentStep + 1,
          status: CONSTANT.EVENT_STORE.STATUS.COMMIT,
        };
        const newEvent = await queryRunner.manager
          .getRepository(EventEntity)
          .save(newEventData);

        await queryRunner.commitTransaction();
        await queryRunner.release();

        const newEventFound = await this.dataSource
          .getRepository(EventEntity)
          .createQueryBuilder("event")
          .where("event.id = :id", {
            id: newEvent.id,
          })
          .andWhere("event.is_deleted = false")
          .orderBy("event.step", "DESC")
          .getOne();

        return resolve({
          result: newEventFound,
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject(error);
      }
    });
  }

  async rollback(compensationId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return new Promise(async (resolve, reject) => {
      try {
        const eventFoundList = await queryRunner.manager
          .getRepository(EventEntity)
          .createQueryBuilder("event")
          .where("event.compensation_id = :compensationId", {
            compensationId,
          })
          .orderBy("event.step", "DESC")
          .getMany();

        await PromiseBlueBird.each(eventFoundList, async function (eventFound) {
          if (eventFound.queryType === CONSTANT.EVENT_STORE.QUERY_TYPE.INSERT) {
            await queryRunner.manager
              .getRepository(
                CONSTANT.EVENT_STORE.ENTITY_TYPE[eventFound.entityType]
              )
              .delete({ id: eventFound?.updateData?.id });
          } else if (
            eventFound.queryType === CONSTANT.EVENT_STORE.QUERY_TYPE.UPDATE
          ) {
            await queryRunner.manager
              .getRepository(
                CONSTANT.EVENT_STORE.ENTITY_TYPE[eventFound.entityType]
              )
              .createQueryBuilder()
              .update(CONSTANT.EVENT_STORE.ENTITY_TYPE[eventFound.entityType])
              .set({ ...eventFound.originData })
              .where(`id = :id`, {
                id: eventFound?.updateData?.id,
              })
              .execute();
          } else if (
            eventFound.queryType === CONSTANT.EVENT_STORE.QUERY_TYPE.DELETE
          ) {
            await queryRunner.manager
              .getRepository(
                CONSTANT.EVENT_STORE.ENTITY_TYPE[eventFound.entityType]
              )
              .save(eventFound.originData);
          }

          await queryRunner.manager.getRepository(EventEntity).update(
            {
              id: eventFound.id,
            },
            {
              status: CONSTANT.EVENT_STORE.STATUS.ROLLBACK,
            }
          );
        });

        await queryRunner.commitTransaction();
        await queryRunner.release();

        return resolve(true);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject(error);
      }
    });
  }

  public async getCurrentStep(compensationId: string): Promise<number> {
    const result = await this.dataSource.manager
      .getRepository(EventEntity)
      .query(
        `SELECT MAX(step) as step FROM "event" WHERE "compensation_id" = $1`,
        [compensationId]
      );

    return parseInt(result[0].step) || 0;
  }

  public async revertToStep(compensationId: string, step: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return new Promise(async (resolve, reject) => {
      try {
        await queryRunner.manager
          .getRepository(EventEntity)
          .createQueryBuilder("event")
          .where("event.step > :step", {
            step,
          })
          .andWhere("event.compensation_id", {
            compensationId,
          })
          .delete();
        await queryRunner.commitTransaction();
        await queryRunner.release();

        return resolve(true);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject(error);
      }
    });
  }
}
