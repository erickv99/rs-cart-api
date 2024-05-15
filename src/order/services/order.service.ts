import { Injectable } from '@nestjs/common';
import { Order } from '../models';
import { v4 } from '../../shared/index';
import { PrismaService } from '../..//db/prisma.service';

@Injectable()
export class OrderService {
  private orders: Record<string, Order> = {};

  constructor(private readonly db: PrismaService) {}

  async findById(orderId: string) {
    const order = await this.db.orders.findUnique({
      where: {
        id: orderId,
      },
      include: {
        cart: {
          include: {
            cart_items: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const delivery = JSON.parse(order.delivery.toString()) as {
      type: string;
      address: any;
    };

    const payment = JSON.parse(order.payment.toString()) as {
      type: string;
      address?: any;
      creditCard?: any;
    };

    return {
      userId: order.user_id,
      cartId: order.cart_id,
      items: order.cart.cart_items.map((item) => {
        return {
          count: item.count,
          product: {
            id: item.product_id,
            price: 10,
          },
        };
      }),
      comments: order.comments,
      delivery,
      payment,
      total: order.total.toNumber(),
      status: order.status,
    };
  }

  create(data: any) {
    const id = v4();
    const order = {
      ...data,
      id,
      status: 'inProgress',
    };

    this.orders[id] = order;

    return order;
  }

  update(orderId, data) {
    const order = this.findById(orderId);

    if (!order) {
      throw new Error('Order does not exist.');
    }

    this.orders[orderId] = {
      ...data,
      id: orderId,
    };
  }
}
