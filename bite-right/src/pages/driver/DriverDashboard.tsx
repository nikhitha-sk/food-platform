import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { deliveryApi } from '@/lib/api/clients';
import { DriverResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Navigation, MapPin, Loader2, MapPinOff, RefreshCw } from 'lucide-react';

type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const DriverDashboard = () => {
  const { user, driverId, setDriverId } = useAuthStore();
  const [driverData, setDriverData] = useState<DriverResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Resolve driver ID
  useEffect(() => {
    if (!user) return;
    const resolve = async () => {
      try {
        const res = await deliveryApi.get(`/delivery/driver/by-auth/${user.id}`);
        setDriverData(res.data);
        setDriverId(res.data.driver.id);
      } catch {
        toast.error('Driver record not found. It may still be processing.');
      } finally { setLoading(false); }
    };
    resolve();
  }, [user]);

  // Send location to backend
  const sendLocationToBackend = useCallback(async (lat: number, lng: number) => {
    try {
      await deliveryApi.patch('/delivery/location', { latitude: lat, longitude: lng });
      setLastLocationUpdate(new Date());
      setCurrentLocation({ lat, lng });
      console.log(`[GPS] Location sent: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch (err) {
      console.error('[GPS] Failed to send location:', err);
    }
  }, []);

  // Request location permission explicitly
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('requesting');
    toast.info('Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('granted');
        toast.success('Location access granted!');
        sendLocationToBackend(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('[GPS] Permission error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          toast.error('Location permission denied. Please enable it in browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationStatus('unavailable');
          toast.error('Location unavailable. Please try again.');
        } else {
          setLocationStatus('denied');
          toast.error('Failed to get location: ' + error.message);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [sendLocationToBackend]);

  // Auto-request permission on mount if we have a driverId
  useEffect(() => {
    if (driverId && locationStatus === 'idle') {
      requestLocationPermission();
    }
  }, [driverId, locationStatus, requestLocationPermission]);

  // GPS polling - only if permission granted
  useEffect(() => {
    if (!driverId || locationStatus !== 'granted') return;

    console.log('[GPS] Starting location polling every 5 seconds...');
    
    const sendCurrentLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocationToBackend(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.error('[GPS] Position error:', err);
          if (err.code === err.PERMISSION_DENIED) {
            setLocationStatus('denied');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Send immediately
    sendCurrentLocation();
    
    // Then every 5 seconds
    const interval = setInterval(sendCurrentLocation, 5000);
    return () => {
      console.log('[GPS] Stopping location polling');
      clearInterval(interval);
    };
  }, [driverId, locationStatus, sendLocationToBackend]);

  const updateDeliveryStatus = async (orderId: number, status: string) => {
    setUpdatingStatus(true);
    try {
      await deliveryApi.patch(`/delivery/${orderId}/status`, { status });
      // Refresh
      const res = await deliveryApi.get(`/delivery/driver/${driverId}`);
      setDriverData(res.data);
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setUpdatingStatus(false); }
  };

  if (loading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (!driverData) return <div className="p-8 text-center py-20 text-muted-foreground">Loading driver profile...</div>;

  const { driver, active_order } = driverData;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold mb-8">Driver Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            <Badge className={driver.is_available ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
              {driver.is_available ? 'Available' : 'On Delivery'}
            </Badge>
          </CardContent>
        </Card>
        
        {/* Location Status Card */}
        <Card className={`shadow-card ${locationStatus === 'granted' ? 'border-success/50' : locationStatus === 'denied' ? 'border-destructive/50' : ''}`}>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">GPS Location</CardTitle></CardHeader>
          <CardContent>
            {locationStatus === 'idle' && (
              <Button size="sm" onClick={requestLocationPermission}>
                <MapPin className="w-4 h-4 mr-1" /> Enable Location
              </Button>
            )}
            {locationStatus === 'requesting' && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Requesting permission...
              </div>
            )}
            {locationStatus === 'granted' && (
              <div className="space-y-1">
                <Badge className="bg-success text-success-foreground">
                  <Navigation className="w-3 h-3 mr-1" /> Active
                </Badge>
                {currentLocation && (
                  <p className="text-xs text-muted-foreground">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                )}
                {lastLocationUpdate && (
                  <p className="text-xs text-muted-foreground">
                    Updated: {lastLocationUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
            {locationStatus === 'denied' && (
              <div className="space-y-2">
                <Badge variant="destructive">
                  <MapPinOff className="w-3 h-3 mr-1" /> Denied
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Location is required for deliveries.
                </p>
                <Button size="sm" variant="outline" onClick={requestLocationPermission}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              </div>
            )}
            {locationStatus === 'unavailable' && (
              <Badge variant="secondary">
                <MapPinOff className="w-3 h-3 mr-1" /> Unavailable
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Backend Location Card */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Stored Location</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <Navigation className="w-4 h-4 inline mr-1" />
            {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-display font-semibold mb-4">Active Order</h2>
      {active_order ? (
        <Card className="shadow-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-display font-bold text-lg">Order #{active_order.order_id}</p>
                <Badge>{active_order.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex gap-2">
                {active_order.status === 'ASSIGNED' && (
                  <Button size="sm" className="gradient-hero text-primary-foreground border-0" disabled={updatingStatus}
                    onClick={() => updateDeliveryStatus(active_order.order_id, 'OUT_FOR_DELIVERY')}>
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <MapPin className="w-4 h-4 mr-1" />}
                    Start Delivery
                  </Button>
                )}
                {active_order.status === 'OUT_FOR_DELIVERY' && (
                  <>
                    <Button size="sm" className="bg-success text-success-foreground" disabled={updatingStatus}
                      onClick={() => updateDeliveryStatus(active_order.order_id, 'DELIVERED')}>
                      Mark Delivered
                    </Button>
                    <Button size="sm" variant="destructive" disabled={updatingStatus}
                      onClick={() => updateDeliveryStatus(active_order.order_id, 'FAILED')}>
                      Mark Failed
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">User ID: {active_order.user_id}</p>
            <p className="text-xs text-muted-foreground mt-1">Assigned: {new Date(active_order.assigned_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 rounded-xl bg-card border border-border">
          <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No active delivery. Stand by for assignments.</p>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
