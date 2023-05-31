import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { CONFIG } from "src/common/configs/config";
import { CONSTANT } from "src/common/utils/constant";
import { PromiseSetTimeout } from "src/common/utils/utils";

@Injectable()
export default class UserEvent {
  constructor(
    @Inject(CONFIG.CLIENT_MODULE.REDIS)
    private readonly redisClient: ClientProxy
  ) {}

  async getListByIds(ids: string[]) {
    return PromiseSetTimeout(
      CONSTANT.CALL_OTHER_SERVICE_TIMEOUT,
      async (resolve, reject) => {
        try {
          await this.redisClient
            .emit(
              {
                command: CONSTANT.EVENT.USER.GET_USER_LIST_BY_IDS,
              },
              {
                ids,
              }
            )
            .subscribe((res: any) => {
              return resolve((res && res.result) || []);
            });
        } catch (error) {
          return reject(error);
        }
      }
    );
  }

  async authUser(accessToken: string) {
    return PromiseSetTimeout(
      CONSTANT.CALL_OTHER_SERVICE_TIMEOUT,
      async (resolve, reject) => {
        try {
          await this.redisClient
            .send(
              {
                command: CONSTANT.EVENT.USER.AUTH,
              },
              {
                accessToken,
              }
            )
            .subscribe((res: any) => {
              if (res && res.error) {
                return reject(res.error);
              }

              return resolve((res && res.result) || null);
            });
        } catch (error) {
          return reject(error);
        }
      }
    );
  }
}
