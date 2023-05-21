import { Injectable, Scope } from "@nestjs/common";
import { EventEmitter } from "events";

@Injectable({ scope: Scope.DEFAULT })
export default class EventEmitterService {
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public get(): EventEmitter {
    return this.eventEmitter;
  }
}
