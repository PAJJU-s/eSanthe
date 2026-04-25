import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Package, ShoppingBag, Tractor, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { insforge } from '../lib/insforge';
import { fetchFarmerProducts } from '../services/products';

function InfoPill({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-border text-sm font-medium text-text">
      <Icon className="h-4 w-4 text-primary" />
      <span>{text}</span>
    </div>
  );
}

export default function FarmerProfile() {
  const { id } = useParams();
  const [farmer, setFarmer] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // Fetch farmer profile
        const { data: profileData, error: profileError } = await insforge.database
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (profileError) throw profileError;

        // Fetch farmer's active listings
        const products = await fetchFarmerProducts(id);

        if (!mounted) return;
        setFarmer(profileData);
        setListings(products.filter((p) => p.is_active));
      } catch (err) {
        if (mounted) toast.error(err.message || 'Failed to load farmer profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="rounded-3xl border border-border bg-white shadow-sm mb-8 overflow-hidden">
          <div className="h-40 md:h-52 bg-border" />
          <div className="px-6 pb-8 mt-4 space-y-3">
            <div className="h-8 bg-border rounded w-1/3" />
            <div className="h-4 bg-border rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🧑‍🌾</div>
        <h2 className="text-2xl font-bold text-text">Farmer not found</h2>
        <p className="text-text-muted mt-2">This farmer profile is unavailable.</p>
      </div>
    );
  }

  const memberYear = farmer.created_at ? new Date(farmer.created_at).getFullYear() : '—';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="rounded-3xl overflow-hidden border border-border bg-white shadow-sm mb-8">
        <div className="h-40 md:h-52 bg-gradient-to-r from-primary via-[#3E8A66] to-accent" />
        <div className="px-6 md:px-8 pb-8">
          <div className="-mt-14 md:-mt-16 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {farmer.avatar_url ? (
                  <img src={farmer.avatar_url} alt={farmer.full_name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-12 w-12 text-primary" />
                )}
              </div>
              <div className="pb-2">
                <h1 className="text-3xl font-bold text-text">{farmer.full_name || 'Farmer'}</h1>
                {farmer.district && (
                  <p className="text-text-muted mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {farmer.district}, Karnataka
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <InfoPill icon={ShoppingBag} text={`${listings.length} active listings`} />
              <InfoPill icon={CalendarDays} text={`Member since ${memberYear}`} />
            </div>
          </div>
        </div>
      </section>

      {farmer.bio && (
        <section className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-text mb-3">About</h2>
          <p className="text-text-muted leading-7">{farmer.bio}</p>
        </section>
      )}

      <section className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Current Listings</h2>
          <div className="inline-flex items-center gap-2 text-sm text-text-muted">
            <Tractor className="h-4 w-4 text-primary" />
            {listings.length} active crops
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <Package className="mx-auto h-10 w-10 mb-2 opacity-30" />
            <p>No active listings at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4 bg-bg hover:bg-primary/5 transition">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                ) : null}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(item.tags || []).map((tag) => (
                    <span key={tag} className="badge">{tag}</span>
                  ))}
                </div>
                <h3 className="font-semibold text-text">{item.name}</h3>
                <p className="text-sm text-text-muted mt-1">{item.quantity} {item.unit} available</p>
                <p className="text-primary text-lg font-bold mt-3">₹{item.price} / {item.unit}</p>
                <Link to={`/product/${item.id}`} className="mt-4 inline-flex items-center justify-center w-full btn-primary">
                  View Product
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold text-text mb-3">Customer Reviews</h2>
        <div className="rounded-2xl border border-dashed border-border bg-bg p-6 text-center">
          <p className="text-text-muted">Reviews are coming soon in Phase 2.</p>
        </div>
      </section>
    </div>
  );
}
