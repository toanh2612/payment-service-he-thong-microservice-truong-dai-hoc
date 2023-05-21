import { CONSTANT } from "src/common/utils/constant";
import EventEmitterService from "../eventEmitter/evenEmitter.service";
import { Injectable, Scope } from "@nestjs/common";

const amqplib = require("amqplib");
@Injectable({ scope: Scope.DEFAULT })
export default class RabbitMQService {
  private connect: any;
  private channel: any;
  constructor(private readonly eventEmitterService: EventEmitterService) {
    if (!this.connect || !this.channel) {
      this.init();
    }
  }

  async init() {
    try {
      const conn = await amqplib.connect(CONSTANT.RABBITMQ.CONNECTION_URL);
      this.connect = conn;
      this.channel = await conn.createChannel();
      return conn;
    } catch (error) {
      throw new Error(error);
    }
  }

  async send(exChangeName, data: any) {
    if (typeof data === "object") {
      data = JSON.stringify(data);
    }
    await this.channel.assertExchange(exChangeName, "fanout", {
      durable: true,
    });
    await this.channel.publish(exChangeName, "", Buffer.from(data));
  }

  async receiver(exChangeName, queueNames) {
    return await Promise.all(
      queueNames.map((queueName) => {
        try {
          return new Promise(async (resolve, reject) => {
            try {
              await this.channel.assertExchange(exChangeName, "fanout", {
                durable: true,
              });

              await this.channel.assertQueue(queueName);
              await this.channel.bindQueue(queueName, exChangeName, "");
              await this.channel.consume(queueName, async (msg: any) => {
                if (msg && msg.content) {
                  this.eventEmitterService.get().emit(queueName, {
                    data: JSON.parse(msg.content.toString()),
                    msg,
                  });
                }
                await this.channel.ack(msg);
              });

              return resolve(queueName);
            } catch (error) {
              return reject(error);
            }
          });
        } catch (error) {
          throw new Error(error);
        }
      })
    );
  }
}
