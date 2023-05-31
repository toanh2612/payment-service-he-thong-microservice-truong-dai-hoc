import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PaymentDetailEntity } from "./PaymentDetail.entity";

@Entity("payment")
export class PaymentEntity {
  @PrimaryGeneratedColumn("uuid", {
    name: "id",
  })
  id: string;

  @Column({
    type: "varchar",
    name: "code",
    nullable: false,
  })
  code: string;

  @Column({
    type: "bigint",
    name: "amount",
    nullable: false,
    default: 0,
  })
  amount: number;

  @Column({
    type: "uuid",
    name: "student_id",
    nullable: false,
  })
  studentId: string;

  @Column({
    type: "varchar",
    name: "payment_type",
    nullable: false,
  })
  paymentType: string;

  @Column({
    type: "varchar",
    name: "status",
    nullable: false,
  })
  status: string;

  @Column({
    type: "uuid",
    name: "compensation_id",
    nullable: true,
  })
  compensationId: string;

  @Column({
    name: "error_message",
    nullable: true,
  })
  errorMessage?: string;

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

  @OneToMany(
    () => PaymentDetailEntity,
    (paymentDetail) => paymentDetail.payment,
    {
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    }
  )
  paymentDetails: PaymentDetailEntity[];
}
