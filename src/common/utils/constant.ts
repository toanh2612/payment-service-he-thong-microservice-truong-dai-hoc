import { CONFIG } from "../configs/config";

export const CONSTANT = {
  SERVICE_NAME: CONFIG.SERVICE_NAME,
  EVENT: {
    USER: {
      GET_USER_LIST_BY_IDS: "USER.GET_USER_LIST_BY_IDS",
      GET_USER_BY_ID: "USER.GET_USER_BY_ID",
      AUTH: "USER.AUTH",
    },
    SCHEDULE: {
      UPDATE_CLASSROOM_SUCCESSED: "SCHEDULE.UPDATE_CLASSROOM",
      UPDATE_CLASS_PERIOD_SUCCESSED: "SCHEDULE.UPDATE_CLASS_PERIOD",
      UPDATE_CLASS_PERIOD_TIME_RANGE_SUCCESSED:
        "SCHEDULE.UPDATE_CLASS_PERIOD_TIME_RANGE",
      CREATE_ATTENDANCE_SUCCESSED: "SCHEDULE.CREATE_ATTENDANCE_SUCCESSED",
      UPDATE_ATTENDANCE_SUCCESSED: "SCHEDULE.UPDATE_ATTENDANCE_SUCCESSED",
      REGISTER_CLASSROOM_INIT: "SCHEDULE.REGISTER_CLASSROOM_INIT",
      CANCEL_CLASSROOM: "SCHEDULE.CANCEL_CLASSROOM",
    },
    PAYMENT: {
      PAYMENT_SUCCESSED: "PAYMENT.PAYMENT_SUCCESSED",
      PAYMENT_FAILED: "PAYMENT.PAYMENT_FAILED",
    },
    NOTIFICATION: {},
  },
  CALL_OTHER_SERVICE_TIMEOUT: 10000,
  RABBITMQ: {
    CONNECTION_URL: `amqp://${CONFIG["RABBITMQ_USERNAME"]}:${CONFIG["RABBITMQ_PASSWORD"]}@localhost`,
    CHANNEL_TYPE: {
      RECEIVE: "receive",
      SEND: "send",
    },
    EXCHANGE_NAME: "TOPIC",
  },
  ERROR: {
    E0000: {
      code: "E0000",
      httpStatusCode: 500,
      message: "General error",
    },
    E0001: {
      code: "E0001",
      httpStatusCode: 402,
      message: "Invalid username or email",
    },
    E0002: {
      code: "E0002",
      httpStatusCode: 404,
      message: "User not found",
    },
    E0003: {
      code: "E0003",
      httpStatusCode: 401,
      message: "Password is wrong",
    },
    E0004: {
      code: "E0004",
      httpStatusCode: 403,
      message: "Not permission",
    },
    E0005: {
      code: "E0005",
      httpStatusCode: 500,
      message: "Can't conntect rabbitMQ",
    },
    E0006: {
      code: "E0006",
      httpStatusCode: 401,
      message: "Unauthorizated",
    },
  },
  EVENT_STORE: {
    QUERY_TYPE: {
      INSERT: "INSERT",
      UPDATE: "UPDATE",
      DELETE: "DELETE",
    },
    STATUS: {
      COMMIT: "COMMIT",
      ROLLBACK: "ROLLBACK",
    },
    ENTITY_TYPE: {
      PAYMENT: "PaymentEntity",
      PAYMENT_DETAIL: "PaymentDetailEntity",
    },
  },
  ENTITY: {
    PAYMENT: {
      STATUS: {
        CANCEL: "CANCEL",
        REFUND: "REFUND",
        INIT: "INIT",
        WAIT: "WAIT",
        DONE: "DONE",
      },
      PAYMENT_TYPE: {
        ZALO_PAY: "ZALO_PAY",
      },
    },
  },
};
