import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { restaurantApi } from '@/lib/api/clients';
import { Restaurant } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Star, MapPin } from 'lucide-react';

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
  <Link to={`/restaurants/${restaurant.id}`} className="group block rounded-2xl bg-white shadow-card border border-border/50 overflow-hidden card-hover">
    <div className="h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
      {restaurant.image_url ? (
        <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <span className="text-5xl">🍽️</span>
      )}
      <Badge 
        variant={restaurant.is_open ? 'default' : 'secondary'} 
        className={`absolute top-3 right-3 ${restaurant.is_open ? 'bg-green-500 text-white border-0' : 'bg-white/90 text-gray-600'}`}
      >
        {restaurant.is_open ? 'Open' : 'Closed'}
      </Badge>
    </div>
    <div className="p-5 space-y-3">
      <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{restaurant.name}</h3>
      {restaurant.cuisine && <p className="text-sm text-muted-foreground font-medium">{restaurant.cuisine}</p>}
      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
        {restaurant.avg_rating > 0 && (
          <span className="flex items-center gap-1.5 bg-orange-50 text-primary px-2 py-1 rounded-lg font-semibold">
            <Star className="w-4 h-4 fill-primary" /> {restaurant.avg_rating.toFixed(1)}
          </span>
        )}
        {restaurant.address && (
          <span className="flex items-center gap-1 truncate"><MapPin className="w-4 h-4 flex-shrink-0" /> {restaurant.address}</span>
        )}
      </div>
    </div>
  </Link>
);

const RestaurantListPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const endpoint = search ? `/restaurants/search?q=${encodeURIComponent(search)}` : '/restaurants';
        const res = await restaurantApi.get(endpoint);
        setRestaurants(res.data.restaurants || []);
      } catch { setRestaurants([]); }
      finally { setLoading(false); }
    };
    const debounce = setTimeout(fetch, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Explore <span className="text-gradient">Restaurants</span></h1>
            <p className="text-muted-foreground">Discover amazing places to eat near you</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              className="pl-12 h-12 rounded-xl border-2 border-border/50 focus:border-primary bg-gray-50/50" 
              placeholder="Search restaurants..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
        
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">No restaurants found</p>
            <p className="text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantListPage;
