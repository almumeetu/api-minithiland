import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ConfirmPaymentDto,
  CreateManualPaymentDto,
  InitiatePaymentDto,
} from './dto/payment.dto';
import { PaymentService } from './payment.service';
import { Public } from '../auth/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate payment for an order' })
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiate(dto);
  }

  @Public()
  @Post('bkash/create')
  @ApiOperation({ summary: 'Create a bKash checkout payment' })
  createBkash(@Body() body: { orderId: string }) {
    return this.paymentService.createBkashPayment(body.orderId);
  }

  @Public()
  @Get('bkash/callback')
  @ApiOperation({ summary: 'Complete bKash checkout callback' })
  async bkashCallback(
    @Query('paymentID') paymentId: string,
    @Query('status') status: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.paymentService.handleBkashCallback(paymentId, status);
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3002';
      response.redirect(`${frontend}/payment/bkash-result?orderId=${encodeURIComponent(result.orderId)}&success=${result.success}`);
    } catch {
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3002';
      response.redirect(`${frontend}/payment/bkash-result?success=false`);
    }
  }

  @Post('manual')
  @ApiOperation({ summary: 'Create manual payment record' })
  createManual(@Body() dto: CreateManualPaymentDto) {
    return this.paymentService.createManual(dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm payment status' })
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.paymentService.confirm(dto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments by order ID' })
  orderPayments(@Param('orderId') orderId: string) {
    return this.paymentService.orderPayments(orderId);
  }
}
