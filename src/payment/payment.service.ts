import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConfirmPaymentDto,
  CreateManualPaymentDto,
  InitiatePaymentDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  private token: { value: string; expiresAt: number } | null = null;

  private getConfig() {
    const required = ['BKASH_USERNAME', 'BKASH_PASSWORD', 'BKASH_APP_KEY', 'BKASH_APP_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new BadRequestException('bKash payment is not configured on the server');
    }
    return {
      baseUrl: (process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta').replace(/\/$/, ''),
      username: process.env.BKASH_USERNAME!,
      password: process.env.BKASH_PASSWORD!,
      appKey: process.env.BKASH_APP_KEY!,
      appSecret: process.env.BKASH_APP_SECRET!,
      callbackUrl: process.env.BKASH_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/payments/bkash/callback`,
    };
  }

  private async bkashRequest<T>(url: string, init: RequestInit, config: ReturnType<PaymentService['getConfig']>): Promise<T> {
    const response = await fetch(url, init);
    const payload = (await response.json().catch(() => ({}))) as T & { statusCode?: string; statusMessage?: string };
    if (!response.ok || payload.statusCode && payload.statusCode !== '0000') {
      throw new BadRequestException(payload.statusMessage || 'bKash request failed');
    }
    return payload;
  }

  private async getBkashToken() {
    const config = this.getConfig();
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return { ...config, token: this.token.value };

    const payload = await this.bkashRequest<{ id_token: string; expires_in?: number }>(
      `${config.baseUrl}/checkout/token/grant`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          username: config.username,
          password: config.password,
        },
        body: JSON.stringify({ app_key: config.appKey, app_secret: config.appSecret }),
      },
      config,
    );
    this.token = {
      value: payload.id_token,
      expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    };
    return { ...config, token: payload.id_token };
  }

  async createBkashPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order with ID ${orderId} not found`);
    if (order.paymentStatus === 'paid') throw new BadRequestException('Order is already paid');

    const existing = await this.prisma.payment.findFirst({
      where: { orderId, method: 'bkash', status: 'pending' },
      orderBy: { id: 'desc' },
    });
    const payment = existing ?? await this.prisma.payment.create({
      data: { orderId, amount: order.total, method: 'bkash', status: 'pending' },
    });
    const config = await this.getBkashToken();
    const payload = await this.bkashRequest<{ paymentID: string; bkashURL: string }>(
      `${config.baseUrl}/checkout/payment/create`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: config.token,
          'X-App-Key': config.appKey,
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: orderId,
          callbackURL: config.callbackUrl,
          amount: Number(order.total).toFixed(2),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: order.orderNumber,
        }),
      },
      config,
    );
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { transactionId: payload.paymentID },
    });
    return { paymentId: payment.id, orderId, bkashURL: payload.bkashURL };
  }

  async handleBkashCallback(paymentId: string, status: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentId, method: 'bkash' },
    });
    if (!payment) throw new NotFoundException('bKash payment not found');
    if (status !== 'success') {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.payment.updateMany({
          where: { id: payment.id, status: 'pending' },
          data: { status: 'failed' },
        });
        if (updated.count !== 1) return;
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: payment.orderId },
          select: { variantId: true, quantity: true },
        });
        for (const item of orderItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              change: item.quantity,
              reason: 'correction',
              referenceId: payment.orderId,
              note: 'Stock restored after failed bKash payment',
            },
          });
        }
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'cancelled' },
        });
      });
      return { orderId: payment.orderId, success: false };
    }

    const config = await this.getBkashToken();
    const payload = await this.bkashRequest<{ transactionStatus?: string; trxID?: string }>(
      `${config.baseUrl}/checkout/payment/execute/${paymentId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: config.token,
          'X-App-Key': config.appKey,
        },
        body: JSON.stringify({}),
      },
      config,
    );
    const success = payload.transactionStatus === 'Completed';
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: success ? 'success' : 'failed',
          transactionId: payload.trxID || paymentId,
          paidAt: success ? new Date() : undefined,
        },
      });
      if (success) {
        await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'paid' } });
      }
    });
    return { orderId: payment.orderId, success };
  }

  async initiate(dto: InitiatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: order.total,
        method: dto.method,
        status: dto.method === 'cod' ? 'pending' : 'pending',
      },
    });
  }

  async createManual(dto: CreateManualPaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    return this.prisma.payment.create({ data: dto });
  }

  async confirm(dto: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: dto.paymentId } });
    if (!payment) throw new NotFoundException(`Payment with ID ${dto.paymentId} not found`);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: dto.paymentId },
        data: {
          status: dto.status,
          transactionId: dto.transactionId,
          paidAt: dto.status === 'success' ? new Date() : undefined,
        },
      });
      if (dto.status === 'success') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'paid' },
        });
      }
      return updated;
    });
  }

  orderPayments(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { paidAt: 'desc' },
    });
  }

}
