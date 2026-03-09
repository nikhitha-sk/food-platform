import { getToken } from '../utils/getToken';
import { Payment } from '@/types/payment';

const API_URL = import.meta.env.VITE_ORDER_API_URL;

type PaymentStatusResponse = {
  payment: Payment;
};

export async function verifyPayment(payload: {
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const res = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || data?.message || 'Payment verification failed';
    throw new Error(message);
  }

  return data;
}

export async function getPaymentByOrder(orderId: number): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments/order/${orderId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch payment status');
  const data: PaymentStatusResponse = await res.json();
  if (!data?.payment) throw new Error('Invalid payment status response');
  return data.payment;
}
