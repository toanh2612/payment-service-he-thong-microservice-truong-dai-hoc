export interface IPayment {
  id: string;
  code: string;
  amount: number;
  studentId: string;
  paymentType: string;
  status: string;
  errorMessage?: string;
  createdDate: Date;
  updatedDate: Date;
  paymentDetails: any;
}
