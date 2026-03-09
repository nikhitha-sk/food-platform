import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { orderApi, deliveryApi } from '@/lib/api/clients';
import { Order, OrderStatus, TrackingResponse } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, MapPin } from 'lucide-react';

const ORDER_STEPS: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PREPARING', 'PREPARED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const TERMINAL = ['CANCELLED', 'FAILED'];
const defaultCenter: [number, number] = [17.385, 78.4867];

const normalizeTrackingStatus = (status: string) => {
  if (status === 'ASSIGNED') {
    return 'OUT_FOR_DELIVERY';
  }
  return status;
};

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const trackingIntervalRef = useRef<number>();

  // Fetch order
  useEffect(() => {
    orderApi.get(`/orders/${id}`).then(res => setOrder(res.data.order || res.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch tracking data for active orders
  const canTrack = order && ['CONFIRMED', 'PREPARING', 'PREPARED', 'OUT_FOR_DELIVERY'].includes(order.status);

  useEffect(() => {
    if (!canTrack || !id) return;

    const fetchTracking = async () => {
      try {
        const res = await deliveryApi.get(`/delivery/track/${id}`);
        setTracking(res.data);
        if (['DELIVERED', 'FAILED'].includes(res.data.status)) {
          clearInterval(trackingIntervalRef.current);
        }
      } catch { /* silent */ }
    };

    fetchTracking();
    trackingIntervalRef.current = window.setInterval(fetchTracking, 5000);
    return () => clearInterval(trackingIntervalRef.current);
  }, [id, canTrack]);

  if (loading) return <div className="container py-8"><Skeleton className="h-64" /></div>;
  if (!order) return <div className="container py-20 text-center text-muted-foreground">Order not found</div>;

  const currentIdx = ORDER_STEPS.indexOf(order.status as OrderStatus);
  const isTerminal = TERMINAL.includes(order.status);

  const hasTrackingCoords =
    typeof tracking?.latitude === 'number' &&
    typeof tracking?.longitude === 'number' &&
    Number.isFinite(tracking.latitude) &&
    Number.isFinite(tracking.longitude);

  const driverPosition: [number, number] = hasTrackingCoords
    ? [tracking!.latitude, tracking!.longitude]
    : defaultCenter;
  const mapSrc = `https://www.google.com/maps?q=${driverPosition[0]},${driverPosition[1]}&z=15&output=embed`;

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold mb-2">Order #{order.id}</h1>
      <p className="text-muted-foreground mb-8">{new Date(order.created_at).toLocaleString()}</p>

      {/* Status Stepper */}
      {isTerminal ? (
        <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <Badge className="bg-destructive text-destructive-foreground text-sm px-4 py-1">{order.status}</Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {order.status === 'CANCELLED' ? 'Refund will appear in 3–5 business days.' : 'Delivery failed. A refund has been initiated.'}
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <p className="text-sm font-medium mb-3">Order Progress</p>
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-1 bg-muted rounded-full" />
            <div
              className="absolute top-4 left-4 h-1 bg-primary rounded-full transition-all duration-700"
              style={{
                width:
                  currentIdx <= 0
                    ? '0%'
                    : `${(currentIdx / (ORDER_STEPS.length - 1)) * 100}%`,
              }}
            />
            <div className="relative grid grid-cols-6 gap-2">
              {ORDER_STEPS.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={step} className="flex flex-col items-center text-center">
                    <div className={cn(
                      'h-8 w-8 rounded-full border-2 flex items-center justify-center text-[11px] font-semibold transition-all duration-500 bg-background',
                      done ? 'border-primary text-primary' : 'border-muted-foreground/40 text-muted-foreground',
                      active && 'ring-4 ring-primary/20 animate-pulse'
                    )}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </div>
                    <span className={cn('mt-2 text-[10px]', done ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Map for trackable orders */}
      {canTrack && (
        <>
          <div className="h-72 rounded-xl border border-border overflow-hidden bg-muted mb-4">
            <iframe
              title="Driver live map"
              src={mapSrc}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              {tracking ? (
                <div>
                  <p className="font-medium">Driver Location</p>
                  <p className="text-sm text-muted-foreground">
                    {hasTrackingCoords
                      ? `Lat: ${tracking.latitude.toFixed(4)}, Lng: ${tracking.longitude.toFixed(4)}`
                      : 'Driver location not available yet'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {['DELIVERED', 'FAILED'].includes(tracking.status)
                      ? 'Delivery complete'
                      : 'Updating every 5 seconds...'}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Waiting for tracking data...</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Order details */}
      <div className="p-6 rounded-xl bg-card shadow-card border border-border space-y-4">
        {/* Item with image */}
        <div className="flex gap-4 items-start pb-4 border-b border-border">
          {order.item_image_url ? (
            <img
              src={order.item_image_url}
              alt={order.item_name}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-medium text-lg">{order.item_name}</h3>
            <p className="text-primary font-display font-bold text-xl">₹{order.item_price.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery Address</span>
          <span className="text-sm text-right max-w-[60%]">{order.delivery_address}</span>
        </div>
        {order.notes && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notes</span>
            <span className="text-sm text-right max-w-[60%]">{order.notes}</span>
          </div>
        )}
      </div>

      {order.status === 'PLACED' && (
        <div className="mt-6">
          <Button variant="destructive" onClick={async () => {
            try {
              await orderApi.patch(`/orders/${order.id}/cancel`);
              setOrder({ ...order, status: 'CANCELLED' });
              toast.success('Order cancelled');
            } catch { toast.error('Cannot cancel'); }
          }}>Cancel Order</Button>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
