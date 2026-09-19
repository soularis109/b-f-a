import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateBillDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  payee!: string;
}
