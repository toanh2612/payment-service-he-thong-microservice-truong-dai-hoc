import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PaymentEntity } from "./payment.entity";

@Entity("payment_detail")
export class PaymentDetailEntity {
  @PrimaryGeneratedColumn("uuid", {
    name: "id",
  })
  id: string;

  @Column({
    type: "uuid",
    name: "student_id",
    nullable: false,
  })
  studentId: string;

  @Column({
    type: "uuid",
    name: "subject_id",
    nullable: false,
  })
  subjectId: string;

  @Column({
    type: "uuid",
    name: "classroom_id",
    nullable: false,
  })
  classroomId: string;

  @Column({
    type: "uuid",
    name: "payment_id",
    nullable: false,
  })
  paymentId: string;

  @Column({
    type: "jsonb",
    name: "subject",
  })
  subject: JSON;

  @Column({
    type: "jsonb",
    name: "classroom",
  })
  classroom: JSON;

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

  @ManyToOne(() => PaymentEntity, (payment) => payment.paymentDetails, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "payment_id",
  })
  payment: PaymentEntity;
}
