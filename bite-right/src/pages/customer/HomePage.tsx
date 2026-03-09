import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, MapPin, Clock, Star, ArrowRight, Sparkles } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="bg-gradient-to-b from-orange-50/50 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px]">
        {/* Background image - Indian food */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&q=80)',
          }}
        />
        {/* Orange gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 via-orange-500/85 to-orange-400/70" />
        
        <div className="container relative py-24 md:py-32">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              Authentic Indian Flavors
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-tight text-white">
              DesiTadka
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-yellow-200">
              Taste of Home
            </p>
            <p className="text-lg text-white/90 max-w-lg leading-relaxed">
              Order authentic Indian cuisine from the best restaurants near you. From biryani to butter chicken, we deliver the desi flavors you love.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-orange-50 border-0 shadow-lg px-8 h-14 text-base font-bold rounded-xl">
                <Link to="/restaurants">
                  Order Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-orange-600 h-14 px-8 text-base font-semibold rounded-xl transition-colors">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Why Choose <span className="text-gradient">DesiTadka</span>?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Experience the best Indian food delivery service with amazing features designed for you.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: MapPin, title: 'Nearby Restaurants', desc: 'Find the best Indian restaurants around you with our location-based search.' },
            { icon: Clock, title: 'Real-time Tracking', desc: 'Track your delivery live on the map from restaurant to your doorstep.' },
            { icon: Star, title: 'Top Rated', desc: 'Browse community-rated restaurants and discover new desi favorites.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-white shadow-card border border-orange-200/50 card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-gray-900">{title}</h3>
              <p className="text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats section */}
      <section className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-400 py-20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
            {[
              { value: '500+', label: 'Desi Restaurants' },
              { value: '50K+', label: 'Happy Foodies' },
              { value: '100K+', label: 'Orders Delivered' },
              { value: '4.9', label: 'App Rating' },
            ].map(({ value, label }) => (
              <div key={label} className="p-4">
                <div className="text-4xl md:text-5xl font-display font-extrabold mb-2 drop-shadow-sm">{value}</div>
                <div className="text-white/90 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 to-orange-400 p-12 md:p-16 shadow-xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596797038530-2c107229654b?w=1200&q=80')] bg-cover bg-center opacity-10" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-600/30 to-transparent" />
          <div className="relative max-w-xl text-white">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Hungry for Desi Food?</h2>
            <p className="text-white/90 text-lg mb-8">Join thousands of food lovers and start ordering your favorite Indian meals today. First order gets 20% off!</p>
            <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-orange-50 border-0 shadow-elevated btn-shine px-8 h-14 text-base font-bold">
              <Link to="/register">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
