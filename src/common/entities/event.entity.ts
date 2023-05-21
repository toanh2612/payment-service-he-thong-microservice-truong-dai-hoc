import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("event")
export class EventEntity {
  @PrimaryGeneratedColumn("uuid", {
    name: "id",
  })
  id: string;

  @Column({
    type: "varchar",
    name: "entity_type",
    nullable: false,
  })
  entityType: string;

  @Column({
    type: "varchar",
    name: "transaction_type",
    nullable: false,
  })
  queryType: string;

  @Column({
    type: "jsonb",
    name: "origin_data",
    nullable: true,
  })
  originData: JSON;

  @Column({
    type: "jsonb",
    name: "update_data",
    nullable: true,
  })
  updateData: JSON;

  @Column({
    type: "integer",
    name: "step",
    nullable: false,
  })
  step: number;

  @Column({
    type: "uuid",
    name: "compensation_id",
    nullable: false,
  })
  compensationId: string;

  @Column({
    type: "varchar",
    name: "status",
    nullable: false,
  })
  status: string;

  @Column({
    name: "is_deleted",
    default: false,
  })
  isDeleted: boolean;

  @CreateDateColumn({
    type: "timestamp",
    name: "created_date",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdDate: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "updated_date",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedDate: Date;
}
