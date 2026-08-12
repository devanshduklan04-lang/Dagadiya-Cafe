'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Coffee, ShoppingCart, Menu as MenuIcon, X, Search, Plus, Minus, Trash2,
  MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Star,
  Truck, Store, CheckCircle2, User, LogOut, ChefHat, Sparkles, Leaf,
  LayoutDashboard, ShoppingBag, TrendingUp, Edit3, Eye, EyeOff,
  Award, ArrowRight, ChevronRight, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

// ---------- CONSTANTS ----------
const HERO_IMG = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&auto=format&fit=crop&q=80';
const GALLERY_IMGS = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
  'https://images.pexels.com/photos/34255748/pexels-photo-34255748.jpeg?w=800&auto=compress&cs=tinysrgb',
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560100261-226dff8daa82?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1623334044303-241021148842?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557941760-987c3f403d5a?w=800&auto=format&fit=crop&q=80',
];
const CATEGORIES = ['All', 'Coffee', 'Tea', 'Cold Beverages', 'Snacks', 'Desserts'];
const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;
const CAFE_WHATSAPP = '918368600234'; // country code + number, no + or spaces
const INR = (n) => '₹' + Number(n || 0).toFixed(2);

// ---------- WHATSAPP HELPERS ----------
function buildWhatsAppOrderMsg({ customer, items, subtotal, deliveryFee, tax, total, deliveryType, address, orderId, paymentMethod }) {
  const lines = [];
  lines.push('🍽️ *New Order — Dagadiya Cafe*');
  if (orderId) lines.push(`Order ID: *${orderId}*`);
  lines.push('');
  if (customer?.name) lines.push(`👤 ${customer.name}`);
  if (customer?.phone) lines.push(`📞 ${customer.phone}`);
  if (customer?.email) lines.push(`📧 ${customer.email}`);
  lines.push('');
  lines.push('*Items:*');
  (items || []).forEach(i => {
    lines.push(`• ${i.name} × ${i.qty} — ${INR(i.price * i.qty)}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${INR(subtotal)}`);
  if (deliveryFee > 0) lines.push(`Delivery: ${INR(deliveryFee)}`);
  if (tax) lines.push(`Taxes: ${INR(tax)}`);
  lines.push(`*Total: ${INR(total)}*`);
  lines.push('');
  lines.push(`🚚 ${deliveryType === 'delivery' ? 'Home Delivery' : 'Self Pickup'}`);
  if (deliveryType === 'delivery' && address) lines.push(`📍 ${address}`);
  if (paymentMethod) lines.push(`💳 ${paymentMethod}`);
  lines.push('');
  lines.push('Please confirm my order 🙏');
  return lines.join('\n');
}
function openWhatsApp(msg) {
  const url = `https://wa.me/${CAFE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ---------- BRAND LOGOMARK ----------
function LogoMark({ className = 'h-10 w-auto' }) {
  return <img src="/logo.png" alt="Dagadiya Cafe" className={className} />;
}

function App() {
  const [view, setView] = useState('home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menu, setMenu] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('bb_cart') || '[]'); setCart(c);
      const u = JSON.parse(localStorage.getItem('bb_user') || 'null'); setUser(u);
      const a = JSON.parse(localStorage.getItem('bb_admin') || 'null'); setAdmin(a);
    } catch (e) {}
  }, []);
  useEffect(() => { localStorage.setItem('bb_cart', JSON.stringify(cart)); }, [cart]);

  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const r = await fetch('/api/menu');
      const d = await r.json();
      setMenu(Array.isArray(d) ? d : []);
    } catch (e) { toast.error('Failed to load menu'); }
    setLoadingMenu(false);
  };
  useEffect(() => { fetchMenu(); }, []);

  const addToCart = (item) => {
    if (!item.available) { toast.error('Item currently unavailable'); return; }
    setCart(prev => {
      const found = prev.find(p => p.id === item.id);
      if (found) return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { id: item.id, name: item.name, price: item.price, image: item.image, qty: 1 }];
    });
    toast.success(item.name + ' added to cart');
  };
  const updateQty = (id, delta) => setCart(prev => prev.flatMap(p => {
    if (p.id !== id) return [p];
    const q = p.qty + delta;
    return q <= 0 ? [] : [{ ...p, qty: q }];
  }));
  const removeFromCart = (id) => setCart(prev => prev.filter(p => p.id !== id));
  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const go = (v) => { setView(v); setMobileNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar view={view} go={go} cartCount={cartCount} onCartClick={() => setCartOpen(true)}
        user={user} admin={admin}
        mobileOpen={mobileNavOpen} setMobileOpen={setMobileNavOpen}
        onLogout={() => { setUser(null); localStorage.removeItem('bb_user'); toast.success('Logged out'); }}
      />

      {view === 'home' && <Home go={go} menu={menu} addToCart={addToCart} />}
      {view === 'menu' && <MenuPage menu={menu} loading={loadingMenu} addToCart={addToCart} />}
      {view === 'about' && <About />}
      {view === 'contact' && <Contact />}
      {view === 'checkout' && <Checkout cart={cart} subtotal={subtotal} go={go} clearCart={clearCart} user={user} setLastOrder={setLastOrder} />}
      {view === 'success' && <Success order={lastOrder} go={go} />}
      {view === 'login' && <AuthPage setUser={(u) => { setUser(u); localStorage.setItem('bb_user', JSON.stringify(u)); }} go={go} />}
      {view === 'profile' && <Profile user={user} go={go} onLogout={() => { setUser(null); localStorage.removeItem('bb_user'); go('home'); }} />}
      {view === 'admin-login' && <AdminLogin setAdmin={(a) => { setAdmin(a); localStorage.setItem('bb_admin', JSON.stringify(a)); go('admin'); }} />}
      {view === 'admin' && (admin ? <AdminDashboard menu={menu} refreshMenu={fetchMenu} /> : <AdminLogin setAdmin={(a) => { setAdmin(a); localStorage.setItem('bb_admin', JSON.stringify(a)); go('admin'); }} />)}

      <Footer go={go} />

      <FloatingWhatsApp cart={cart} subtotal={subtotal} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart}
        updateQty={updateQty} removeFromCart={removeFromCart} subtotal={subtotal}
        onCheckout={() => { setCartOpen(false); go('checkout'); }}
        onContinue={() => { setCartOpen(false); go('menu'); }}
      />
    </div>
  );
}

function Navbar({ view, go, cartCount, onCartClick, user, admin, mobileOpen, setMobileOpen, onLogout }) {
  const links = [
    { key: 'home', label: 'Home' },
    { key: 'menu', label: 'Menu' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20 px-4">
        <button onClick={() => go('home')} className="flex items-center gap-2 group">
          <img src="/logo.png" alt="Dagadiya Cafe" className="h-12 md:h-14 w-auto group-hover:scale-105 transition"/>
        </button>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <button key={l.key} onClick={() => go(l.key)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${view === l.key ? 'bg-secondary text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-muted'}`}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => go('profile')} className="hidden md:inline-flex">
              <User className="w-4 h-4 mr-1" /> {user.name?.split(' ')[0]}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => go('login')} className="hidden md:inline-flex">
              <User className="w-4 h-4 mr-1" /> Sign in
            </Button>
          )}
          {admin && (
            <Button size="sm" variant="secondary" onClick={() => go('admin')} className="hidden md:inline-flex">
              <LayoutDashboard className="w-4 h-4 mr-1" /> Admin
            </Button>
          )}
          <Button onClick={onCartClick} className="relative rounded-full" size="sm">
            <ShoppingCart className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold grid place-items-center border-2 border-background">
                {cartCount}
              </span>
            )}
          </Button>
          <button className="md:hidden ml-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95">
          <div className="container py-3 flex flex-col">
            {links.map(l => (
              <button key={l.key} onClick={() => go(l.key)}
                className={`text-left px-3 py-3 rounded-lg text-sm font-medium ${view === l.key ? 'bg-secondary text-primary' : ''}`}>
                {l.label}
              </button>
            ))}
            {user ? (
              <>
                <button onClick={() => go('profile')} className="text-left px-3 py-3 rounded-lg text-sm font-medium">My Profile</button>
                <button onClick={onLogout} className="text-left px-3 py-3 rounded-lg text-sm font-medium text-destructive">Sign out</button>
              </>
            ) : (
              <button onClick={() => go('login')} className="text-left px-3 py-3 rounded-lg text-sm font-medium">Sign in / Sign up</button>
            )}
            {admin ? (
              <button onClick={() => go('admin')} className="text-left px-3 py-3 rounded-lg text-sm font-medium">Admin Dashboard</button>
            ) : (
              <button onClick={() => go('admin-login')} className="text-left px-3 py-3 rounded-lg text-sm font-medium">Admin Login</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Home({ go, menu, addToCart }) {
  const featured = menu.filter(m => m.featured).slice(0, 6);
  const bestsellers = menu.filter(m => m.bestseller).slice(0, 4);
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Café interior" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        </div>
        <div className="relative container px-4 py-24 md:py-40 text-white">
          <div className="max-w-2xl fade-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Freshly roasted, hand-crafted daily
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] text-balance">
              Where every cup<br/>tells a <em className="not-italic text-amber-300">story</em>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-xl">
              Small-batch artisan coffee, timeless tea rituals, and pastries baked from scratch. Order online for pickup or delivery to your doorstep.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => go('menu')} className="rounded-full text-base h-12 px-6 bg-amber-500 hover:bg-amber-400 text-black">
                Order Now <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => go('about')} className="rounded-full text-base h-12 px-6 bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
                Our Story
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 md:gap-8 text-sm">
              <div><div className="text-2xl font-bold text-amber-300">4.9★</div><div className="text-white/70">1200+ reviews</div></div>
              <div className="h-8 w-px bg-white/30"/>
              <div><div className="text-2xl font-bold text-amber-300">15+</div><div className="text-white/70">Years brewing</div></div>
              <div className="h-8 w-px bg-white/30"/>
              <div><div className="text-2xl font-bold text-amber-300">100%</div><div className="text-white/70">Arabica beans</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-20">
        <SectionHeader eyebrow="Our Selection" title="Featured Menu Items" desc="A curated taste of what our baristas love brewing today."/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((m, i) => (
            <MenuCard key={m.id} item={m} onAdd={() => addToCart(m)} delay={i*0.05} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Button variant="outline" onClick={() => go('menu')} className="rounded-full">Explore full menu <ChevronRight className="w-4 h-4 ml-1"/></Button>
        </div>
      </section>

      <section className="bg-secondary/50 py-20">
        <div className="container px-4">
          <SectionHeader eyebrow="Crowd Favourites" title="Best-Selling Products" desc="These are ordered by our regulars over &amp; over again."/>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {bestsellers.map(m => (
              <button key={m.id} onClick={() => addToCart(m)} className="group text-left">
                <div className="aspect-square overflow-hidden rounded-2xl bg-muted mb-3">
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy"/>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.category}</div>
                  </div>
                  <div className="font-bold text-primary">{INR(m.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 py-20">
        <SectionHeader eyebrow="Why Choose Us" title="Crafted with obsession" desc="Small-batch quality, delivered with warmth."/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ChefHat, title: 'Artisan Baristas', desc: 'Every drink is hand-pulled by trained specialists who care about the craft.' },
            { icon: Leaf, title: 'Ethically Sourced', desc: 'Direct-trade, single-origin beans and organic teas from family farms.' },
            { icon: Award, title: 'Award Winning', desc: 'Voted best café in the city 3 years running for taste and hospitality.' },
          ].map((f, i) => (
            <Card key={i} className="border-none shadow-md hover:shadow-xl transition rounded-2xl">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <f.icon className="w-6 h-6"/>
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-20">
        <div className="container px-4">
          <SectionHeader light eyebrow="Kind words" title="What our guests say" desc=""/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Ananya S.', role: 'Regular since 2021', text: "The masala chai here reminds me of my grandmother's kitchen. Absolute comfort in a cup." },
              { name: 'Rohan M.', role: 'Coffee snob', text: "Their single-origin pour-over rivals anything I've had in Melbourne. The baristas actually know their beans." },
              { name: 'Priya K.', role: 'Freelancer', text: "My work-from-café spot. Fast wifi, perfect lattes, and the tiramisu is dangerous." },
            ].map((t, i) => (
              <div key={i} className="bg-primary-foreground/5 backdrop-blur border border-primary-foreground/10 rounded-2xl p-6">
                <div className="flex text-amber-300 mb-3">{[...Array(5)].map((_,j) => <Star key={j} className="w-4 h-4 fill-current"/>)}</div>
                <p className="text-primary-foreground/90 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-primary-foreground/60">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 py-20">
        <SectionHeader eyebrow="Moments" title="Inside Dagadiya Cafe" desc="A peek into our little world."/>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {GALLERY_IMGS.map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-2xl bg-muted ${i % 5 === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'}`}>
              <img src={src} alt="Gallery" className="w-full h-full object-cover hover:scale-110 transition duration-700" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <section className="container px-4 pb-20">
        <SectionHeader eyebrow="Visit Us" title="Find our café" desc="We'd love to see you soon."/>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl overflow-hidden border border-border h-[420px]">
            <iframe title="map" className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=55G8%2B75+Athhoorwala,+Uttarakhand&output=embed" />
          </div>
          <div className="space-y-4">
            <InfoRow icon={MapPin} title="Address" text="Chowk No.3, Athhoorwala, Uttarakhand 248016"/>
            <InfoRow icon={Phone} title="Call us" text="+91 83686 00234"/>
            <InfoRow icon={Mail} title="Email" text="hello@dagadiyacafe.com"/>
            <InfoRow icon={Clock} title="Open hours" text="Mon–Sun · 7:00 AM – 11:00 PM"/>
            <Button onClick={() => go('contact')} className="rounded-full">Contact us</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-secondary text-primary grid place-items-center shrink-0"><Icon className="w-4 h-4"/></div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="font-medium">{text}</div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc, light }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      <div className={`text-xs uppercase tracking-[0.3em] font-semibold mb-3 ${light ? 'text-amber-300' : 'text-accent'}`}>{eyebrow}</div>
      <h2 className={`font-display text-4xl md:text-5xl font-bold text-balance ${light ? 'text-primary-foreground' : ''}`}>{title}</h2>
      {desc && <p className={`mt-4 ${light ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{desc}</p>}
    </div>
  );
}

function MenuCard({ item, onAdd, delay = 0 }) {
  return (
    <Card className="overflow-hidden group border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-2xl fade-up" style={{ animationDelay: `${delay}s` }}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy" />
        {item.bestseller && <Badge className="absolute top-3 left-3 bg-amber-500 text-black hover:bg-amber-500">★ Bestseller</Badge>}
        {!item.available && <div className="absolute inset-0 bg-black/60 grid place-items-center text-white font-semibold">Currently Unavailable</div>}
      </div>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-accent font-semibold">{item.category}</div>
        <h3 className="font-display text-xl font-bold mt-1">{item.name}</h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">{item.description}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="text-xl font-bold text-primary">{INR(item.price)}</div>
          <Button size="sm" onClick={onAdd} disabled={!item.available} className="rounded-full">
            <Plus className="w-4 h-4 mr-1"/> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MenuPage({ menu, loading, addToCart }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const filtered = menu.filter(m => {
    if (cat !== 'All' && m.category !== cat) return false;
    if (q && !(m.name.toLowerCase().includes(q.toLowerCase()) || m.description.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  return (
    <div className="container px-4 py-12 md:py-16">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-[0.3em] font-semibold text-accent">The Full Menu</div>
        <h1 className="font-display text-5xl md:text-6xl font-bold mt-3">Something for every mood.</h1>
        <p className="text-muted-foreground mt-3 text-lg">From bold espresso to soothing chamomile — explore our full selection.</p>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between sticky top-16 md:top-20 z-20 py-3 bg-background/85 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition ${cat === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <Input placeholder="Search menu…" value={q} onChange={e => setQ(e.target.value)} className="pl-9 rounded-full"/>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-muted animate-pulse">
              <div className="aspect-[4/3] bg-muted-foreground/10"/>
              <div className="p-5 space-y-2"><div className="h-4 w-1/3 bg-muted-foreground/10 rounded"/><div className="h-6 w-2/3 bg-muted-foreground/10 rounded"/><div className="h-4 w-full bg-muted-foreground/10 rounded"/></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Coffee className="w-12 h-12 mx-auto text-muted-foreground mb-3"/>
          <div className="text-lg font-semibold">No items match your search</div>
          <div className="text-muted-foreground">Try a different keyword or category.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filtered.map((m, i) => <MenuCard key={m.id} item={m} onAdd={() => addToCart(m)} delay={i*0.03}/>)}
        </div>
      )}
    </div>
  );
}

function CartDrawer({ open, onClose, cart, updateQty, removeFromCart, subtotal, onCheckout, onContinue }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}/>
      <div className={`absolute right-0 top-0 h-full w-full sm:w-[440px] bg-background border-l border-border shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <div className="font-display text-2xl font-bold">Your Cart</div>
            <div className="text-xs text-muted-foreground">{cart.length} item{cart.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-muted grid place-items-center"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50"/>
              <div>Your cart is empty</div>
              <Button className="mt-4 rounded-full" onClick={onContinue}>Browse menu</Button>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-secondary/40">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover"/>
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">{INR(item.price)} each</div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-background border grid place-items-center hover:bg-muted"><Minus className="w-3 h-3"/></button>
                  <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, +1)} className="w-7 h-7 rounded-full bg-background border grid place-items-center hover:bg-muted"><Plus className="w-3 h-3"/></button>
                  <button onClick={() => removeFromCart(item.id)} className="ml-auto text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="font-bold">{INR(item.price * item.qty)}</div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-border p-5 space-y-3 bg-background">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{INR(subtotal)}</span></div>
            <div className="text-xs text-muted-foreground">Delivery &amp; taxes calculated at checkout.</div>
            <Button size="lg" className="w-full rounded-full h-12" onClick={onCheckout}>Proceed to Checkout <ArrowRight className="w-4 h-4 ml-1"/></Button>
            <Button variant="ghost" className="w-full" onClick={onContinue}>Continue shopping</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Checkout({ cart, subtotal, go, clearCart, user, setLastOrder }) {
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email: user?.email || '', address: '', notes: '',
  });
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [payment, setPayment] = useState('COD');
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + deliveryFee + tax;

  if (cart.length === 0) {
    return (
      <div className="container px-4 py-24 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4"/>
        <h2 className="font-display text-3xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2">Add something delicious first.</p>
        <Button className="mt-6 rounded-full" onClick={() => go('menu')}>Browse Menu</Button>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.email) { toast.error('Please fill in your details'); return; }
    if (deliveryType === 'delivery' && !form.address) { toast.error('Delivery address is required'); return; }
    setSubmitting(true);
    try {
      if (payment !== 'COD' && payment !== 'WhatsApp') {
        toast.loading('Processing payment…', { id: 'pay' });
        await new Promise(r => setTimeout(r, 1200));
        toast.success('Payment successful', { id: 'pay' });
      }
      const r = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form, items: cart, subtotal, deliveryFee, tax, total,
          deliveryType, address: form.address, paymentMethod: payment,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setLastOrder(data);
      // If WhatsApp, open chat with prefilled order
      if (payment === 'WhatsApp') {
        const msg = buildWhatsAppOrderMsg({
          customer: form, items: cart, subtotal, deliveryFee, tax, total,
          deliveryType, address: form.address, orderId: data.orderId, paymentMethod: 'WhatsApp',
        });
        openWhatsApp(msg);
      }
      clearCart();
      go('success');
    } catch (e) { toast.error(e.message || 'Order failed'); }
    setSubmitting(false);
  };

  return (
    <div className="container px-4 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold">Checkout</h1>
      <p className="text-muted-foreground mt-2">Almost there — just a few details.</p>

      <div className="grid lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="font-display">Your Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></div>
                <div><Label>Phone Number *</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></div>
              </div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}/></div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="font-display">Delivery Method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={deliveryType} onValueChange={setDeliveryType} className="grid md:grid-cols-2 gap-4">
                <label className={`border rounded-2xl p-4 cursor-pointer flex gap-3 ${deliveryType === 'pickup' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="pickup" id="pickup"/>
                  <div>
                    <div className="flex items-center gap-2 font-semibold"><Store className="w-4 h-4"/> Self Pickup</div>
                    <div className="text-sm text-muted-foreground mt-1">Ready in ~15 mins at our café. Free.</div>
                  </div>
                </label>
                <label className={`border rounded-2xl p-4 cursor-pointer flex gap-3 ${deliveryType === 'delivery' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="delivery" id="delivery"/>
                  <div>
                    <div className="flex items-center gap-2 font-semibold"><Truck className="w-4 h-4"/> Home Delivery</div>
                    <div className="text-sm text-muted-foreground mt-1">Delivered in 30–45 mins. {INR(DELIVERY_FEE)} fee.</div>
                  </div>
                </label>
              </RadioGroup>
              {deliveryType === 'delivery' && (
                <div className="mt-4">
                  <Label>Delivery Address *</Label>
                  <Textarea rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="House / Flat, Street, Landmark, City, Pincode"/>
                </div>
              )}
              <div className="mt-4">
                <Label>Order Notes (optional)</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any special instructions?"/>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="font-display">Payment Method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={payment} onValueChange={setPayment} className="grid sm:grid-cols-2 gap-3">
                {[
                  { v: 'UPI', label: 'UPI', hint: 'Any UPI app' },
                  { v: 'GooglePay', label: 'Google Pay', hint: 'Quick pay' },
                  { v: 'PhonePe', label: 'PhonePe', hint: "India's favourite" },
                  { v: 'Paytm', label: 'Paytm', hint: 'Wallet & UPI' },
                  { v: 'BHIM', label: 'BHIM UPI', hint: 'Direct bank' },
                  { v: 'Card', label: 'Credit / Debit Card', hint: 'Visa · MC · Rupay' },
                  { v: 'NetBanking', label: 'Net Banking', hint: 'All major banks' },
                  { v: 'Wallet', label: 'Wallets', hint: 'Amazon Pay etc.' },
                  { v: 'WhatsApp', label: 'Order on WhatsApp', hint: 'We confirm on chat' },
                  { v: 'COD', label: 'Cash on Delivery', hint: 'Pay on arrival' },
                ].map(p => (
                  <label key={p.v} className={`border rounded-xl p-3 cursor-pointer flex gap-3 items-start ${payment === p.v ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value={p.v} id={p.v}/>
                    <div>
                      <div className="font-medium text-sm">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.hint}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              <div className="text-xs text-muted-foreground mt-3">🔒 Payments are simulated in this demo. Real Razorpay integration ready — provide keys to enable.</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="rounded-2xl sticky top-24">
            <CardHeader><CardTitle className="font-display">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {cart.map(i => (
                <div key={i.id} className="flex gap-3 text-sm">
                  <img src={i.image} className="w-12 h-12 rounded-lg object-cover" alt=""/>
                  <div className="flex-1">
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.qty} · {INR(i.price)}</div>
                  </div>
                  <div className="font-semibold">{INR(i.qty * i.price)}</div>
                </div>
              ))}
              <Separator/>
              <Row label="Subtotal" value={INR(subtotal)}/>
              <Row label={deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} value={deliveryFee === 0 ? 'Free' : INR(deliveryFee)}/>
              <Row label={`Taxes (${(TAX_RATE*100).toFixed(0)}%)`} value={INR(tax)}/>
              <Separator/>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{INR(total)}</span></div>
              <Button size="lg" className="w-full rounded-full h-12 mt-2" onClick={placeOrder} disabled={submitting}>
                {submitting ? 'Placing…' : `Place Order · ${INR(total)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function Success({ order, go }) {
  if (!order) return <div className="container px-4 py-24 text-center"><Button onClick={() => go('home')}>Back home</Button></div>;
  return (
    <div className="container px-4 py-16 max-w-2xl">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 text-accent mx-auto grid place-items-center mb-4">
          <CheckCircle2 className="w-10 h-10"/>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground mt-2">Thank you {order.customer?.name?.split(' ')[0]}. We're already brewing.</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-sm">
          Order ID: <span className="font-mono font-bold text-primary">{order.orderId}</span>
        </div>
      </div>

      <Card className="mt-8 rounded-2xl">
        <CardHeader><CardTitle className="font-display">Order Summary</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <div>{i.name} × {i.qty}</div>
              <div className="font-medium">{INR(i.price * i.qty)}</div>
            </div>
          ))}
          <Separator/>
          <Row label="Subtotal" value={INR(order.subtotal)}/>
          <Row label={order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} value={order.deliveryFee === 0 ? 'Free' : INR(order.deliveryFee)}/>
          <Row label="Taxes" value={INR(order.tax)}/>
          <Separator/>
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">{INR(order.total)}</span></div>
          <Separator/>
          <Row label="Payment" value={`${order.paymentMethod} · ${order.paymentStatus}`}/>
          <Row label="Delivery" value={order.deliveryType === 'delivery' ? order.address || '—' : 'Pickup from café'}/>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center mt-8 flex-wrap">
        <Button variant="outline" onClick={() => go('home')} className="rounded-full">Back home</Button>
        <Button onClick={() => go('menu')} className="rounded-full">Order more</Button>
        <Button onClick={() => openWhatsApp(buildWhatsAppOrderMsg({ ...order, customer: order.customer, deliveryType: order.deliveryType }))}
          className="rounded-full bg-[#25D366] hover:bg-[#20b858] text-white">
          <MessageCircle className="w-4 h-4 mr-1"/> Send to WhatsApp
        </Button>
      </div>
    </div>
  );
}

function About() {
  return (
    <div>
      <section className="container px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] font-semibold text-accent">Our Story</div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-3 leading-tight">Brewed with love since 2010.</h1>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Dagadiya Cafe began as a tiny corner shop with one espresso machine and one big idea: that a great cup of coffee could
            slow the world down. Fifteen years later, we're still obsessed with that same idea — sourcing single-origin beans
            directly from farmers, roasting in small batches, and pulling every shot by hand.
          </p>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Beyond coffee, our kitchen bakes everything fresh each morning — croissants at 5am, cakes by 8am, and warm smiles all day.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Stat n="15+" l="Years"/>
            <Stat n="200K" l="Cups poured"/>
            <Stat n="12" l="Bean origins"/>
          </div>
        </div>
        <div className="relative">
          <img src={GALLERY_IMGS[0]} className="rounded-2xl w-full aspect-[4/5] object-cover" alt=""/>
          <img src={GALLERY_IMGS[1]} className="hidden md:block absolute -bottom-8 -left-8 w-1/2 rounded-2xl aspect-square object-cover border-4 border-background shadow-xl" alt=""/>
        </div>
      </section>

      <section className="bg-secondary/50 py-20">
        <div className="container px-4">
          <SectionHeader eyebrow="Values" title="What we stand for" desc=""/>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: 'Craft', d: 'Every drink is a small act of care. No shortcuts.' },
              { t: 'Community', d: 'A café is a living room for the neighbourhood.' },
              { t: 'Conscience', d: 'Direct trade, compostable cups, kitchen zero-waste.' },
            ].map((v, i) => (
              <Card key={i} className="rounded-2xl border-none shadow-md"><CardContent className="p-8">
                <div className="font-display text-3xl font-bold text-primary mb-2">0{i+1}</div>
                <h3 className="font-semibold text-xl">{v.t}</h3>
                <p className="text-muted-foreground mt-2">{v.d}</p>
              </CardContent></Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, l }) {
  return <div><div className="font-display text-3xl md:text-4xl font-bold text-primary">{n}</div><div className="text-sm text-muted-foreground">{l}</div></div>;
}

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (e) => { e.preventDefault(); toast.success("Message sent! We'll get back to you soon."); setForm({ name:'', email:'', message:'' }); };
  return (
    <div className="container px-4 py-16 md:py-24">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-[0.3em] font-semibold text-accent">Get in touch</div>
        <h1 className="font-display text-5xl md:text-6xl font-bold mt-3">We'd love to hear from you.</h1>
        <p className="text-muted-foreground mt-3 text-lg">Questions, private events, catering, or just a hello.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-10 mt-12">
        <Card className="rounded-2xl">
          <CardContent className="p-8">
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Name</Label><Input required value={form.name} onChange={e => setForm({...form, name:e.target.value})}/></div>
              <div><Label>Email</Label><Input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})}/></div>
              <div><Label>Message</Label><Textarea required rows={5} value={form.message} onChange={e => setForm({...form, message:e.target.value})}/></div>
              <Button type="submit" size="lg" className="rounded-full w-full">Send message</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <InfoRow icon={MapPin} title="Visit" text="Chowk No.3, Athhoorwala, Uttarakhand 248016"/>
          <InfoRow icon={Phone} title="Call" text="+91 83686 00234"/>
          <InfoRow icon={Mail} title="Email" text="hello@dagadiyacafe.com"/>
          <InfoRow icon={Clock} title="Hours" text="Mon–Sun · 7:00 AM – 11:00 PM"/>
          <div className="flex gap-3 pt-2">
            <a href="#" className="w-10 h-10 rounded-full bg-secondary grid place-items-center text-primary hover:bg-primary hover:text-primary-foreground transition"><Instagram className="w-4 h-4"/></a>
            <a href="#" className="w-10 h-10 rounded-full bg-secondary grid place-items-center text-primary hover:bg-primary hover:text-primary-foreground transition"><Facebook className="w-4 h-4"/></a>
            <a href="#" className="w-10 h-10 rounded-full bg-secondary grid place-items-center text-primary hover:bg-primary hover:text-primary-foreground transition"><Twitter className="w-4 h-4"/></a>
          </div>
          <div className="rounded-2xl overflow-hidden border h-[280px]">
            <iframe title="map2" className="w-full h-full" loading="lazy" src="https://www.google.com/maps?q=55G8%2B75+Athhoorwala,+Uttarakhand&output=embed"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage({ setUser, go }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setUser(d.user);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      go('home');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div className="container px-4 py-16 max-w-md">
      <Card className="rounded-2xl">
        <CardContent className="p-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Dagadiya Cafe" className="h-24 w-auto"/>
          </div>
          <h1 className="font-display text-3xl font-bold text-center">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="text-center text-sm text-muted-foreground mt-1">{mode === 'login' ? 'Sign in to your Dagadiya Cafe account' : 'Join the club — track orders & earn perks'}</p>
          <form onSubmit={submit} className="space-y-4 mt-6">
            {mode === 'signup' && (<>
              <div><Label>Full name</Label><Input required value={form.name} onChange={e => setForm({...form, name:e.target.value})}/></div>
              <div><Label>Phone (optional)</Label><Input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/></div>
            </>)}
            <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})}/></div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input required type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password:e.target.value})}/>
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>{loading ? '…' : (mode === 'login' ? 'Sign in' : 'Create account')}</Button>
          </form>
          <div className="text-center text-sm mt-4 text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
            <button className="text-primary font-semibold" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Sign up' : 'Sign in'}</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Profile({ user, go, onLogout }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    if (!user) return;
    fetch(`/api/users/${encodeURIComponent(user.email)}/orders`).then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : []));
  }, [user]);
  if (!user) return <div className="container px-4 py-24 text-center"><Button onClick={() => go('login')}>Sign in</Button></div>;
  return (
    <div className="container px-4 py-16">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground grid place-items-center font-display text-2xl">{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1 className="font-display text-3xl font-bold">{user.name}</h1>
            <div className="text-muted-foreground text-sm">{user.email}{user.phone ? ` · ${user.phone}` : ''}</div>
          </div>
        </div>
        <Button variant="outline" onClick={onLogout} className="rounded-full"><LogOut className="w-4 h-4 mr-1"/> Sign out</Button>
      </div>
      <h2 className="font-display text-2xl font-bold mt-10">Order History</h2>
      <div className="mt-4 space-y-3">
        {orders.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">No orders yet. <button className="text-primary font-semibold" onClick={() => go('menu')}>Browse menu →</button></CardContent></Card>
        ) : orders.map(o => (
          <Card key={o.id} className="rounded-2xl">
            <CardContent className="p-5 flex flex-wrap items-center gap-4 justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Order</div>
                <div className="font-mono font-bold">{o.orderId}</div>
              </div>
              <div><div className="text-xs text-muted-foreground">Items</div><div className="font-medium">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</div></div>
              <div><div className="text-xs text-muted-foreground">Total</div><div className="font-bold text-primary">{INR(o.total)}</div></div>
              <Badge variant="secondary">{o.status}</Badge>
              <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminLogin({ setAdmin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await fetch('/api/auth/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Login failed');
      setAdmin({ token: d.token, username: form.username });
      toast.success('Welcome, admin');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  return (
    <div className="container px-4 py-16 max-w-md">
      <Card className="rounded-2xl">
        <CardContent className="p-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center"><LayoutDashboard className="w-6 h-6"/></div>
          </div>
          <h1 className="font-display text-3xl font-bold text-center">Admin Login</h1>
          <p className="text-center text-sm text-muted-foreground mt-1">Restricted access</p>
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div><Label>Username</Label><Input required value={form.username} onChange={e => setForm({...form, username: e.target.value})}/></div>
            <div><Label>Password</Label><Input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}/></div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>{loading ? '…' : 'Sign in'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ menu, refreshMenu }) {
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const loadOrders = () => fetch('/api/orders').then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : []));
  const loadAnalytics = () => fetch('/api/analytics').then(r => r.json()).then(setAnalytics);
  useEffect(() => { loadOrders(); loadAnalytics(); }, []);

  return (
    <div className="container px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] font-semibold text-accent">Admin</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Dashboard</h1>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="grid grid-cols-3 md:w-[480px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Overview analytics={analytics} orders={orders}/>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersAdmin orders={orders} reload={loadOrders}/>
        </TabsContent>

        <TabsContent value="menu" className="mt-6">
          <MenuAdmin menu={menu} refresh={refreshMenu}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Overview({ analytics, orders }) {
  const stats = [
    { label: 'Revenue (Today)', value: INR(analytics?.totals?.today || 0), icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Revenue (Week)', value: INR(analytics?.totals?.week || 0), icon: TrendingUp, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Revenue (Month)', value: INR(analytics?.totals?.month || 0), icon: TrendingUp, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Total Orders', value: analytics?.totalOrders || 0, icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl grid place-items-center ${s.color} mb-3`}><s.icon className="w-5 h-5"/></div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold font-display">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="font-display">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.revenueSeries || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}/>
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="font-display">Revenue by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.categorySeries || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}/>
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[8,8,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="font-display">Latest Orders</CardTitle></CardHeader>
        <CardContent>
          {orders.slice(0, 5).length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No orders yet.</div>}
          <div className="divide-y">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="py-3 flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <div className="font-mono text-sm font-semibold">{o.orderId}</div>
                  <div className="text-xs text-muted-foreground">{o.customer?.name} · {new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <Badge variant="secondary">{o.status}</Badge>
                <div className="font-bold text-primary">{INR(o.total)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ORDER_STATUSES = ['Received', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
function OrdersAdmin({ orders, reload }) {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const updateStatus = async (id, status) => {
    await fetch(`/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    toast.success('Order updated');
    reload();
  };
  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {['All', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${filter === s ? 'bg-primary text-primary-foreground border-primary' : ''}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(o => (
          <Card key={o.id} className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-3 items-start justify-between">
                <div>
                  <div className="font-mono font-bold">{o.orderId}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                  <div className="text-sm mt-2"><span className="font-semibold">{o.customer?.name}</span> · {o.customer?.phone} · {o.customer?.email}</div>
                  <div className="text-xs text-muted-foreground">{o.deliveryType === 'delivery' ? `Delivery: ${o.address}` : 'Self pickup'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold text-primary">{INR(o.total)}</div>
                  <div className="text-xs">{o.paymentMethod} · {o.paymentStatus}</div>
                </div>
              </div>
              <Separator className="my-3"/>
              <div className="text-sm space-y-1">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.name} × {i.qty}</span>
                    <span>{INR(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                {ORDER_STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(o.id, s)}
                    className={`px-3 py-1 text-xs rounded-full border transition ${o.status === s ? 'bg-accent text-accent-foreground border-accent' : 'hover:bg-muted'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-12">No orders in this status.</div>}
      </div>
    </div>
  );
}

function MenuAdmin({ menu, refresh }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const emptyItem = { name: '', category: 'Coffee', price: 0, description: '', image: '', available: true, featured: false, bestseller: false };

  const save = async (item) => {
    try {
      const isNew = !item.id;
      const url = isNew ? '/api/menu' : `/api/menu/${item.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
      if (!r.ok) throw new Error('Save failed');
      toast.success(isNew ? 'Item added' : 'Item updated');
      setEditing(null); setCreating(false); refresh();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    toast.success('Item deleted'); refresh();
  };
  const toggleAvail = async (item) => {
    await fetch(`/api/menu/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !item.available }) });
    refresh();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">{menu.length} items</div>
        <Button onClick={() => setCreating(true)} className="rounded-full"><Plus className="w-4 h-4 mr-1"/> Add Item</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu.map(m => (
          <Card key={m.id} className="rounded-2xl overflow-hidden">
            <div className="aspect-video bg-muted overflow-hidden"><img src={m.image} className="w-full h-full object-cover" alt=""/></div>
            <CardContent className="p-4">
              <div className="text-xs text-accent uppercase tracking-wider font-semibold">{m.category}</div>
              <div className="font-display text-lg font-bold">{m.name}</div>
              <div className="text-sm font-semibold text-primary">{INR(m.price)}</div>
              <div className="flex items-center gap-2 mt-3">
                <Switch checked={m.available} onCheckedChange={() => toggleAvail(m)}/>
                <span className="text-xs text-muted-foreground">{m.available ? 'Available' : 'Unavailable'}</span>
                <div className="ml-auto flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(m)}><Edit3 className="w-4 h-4"/></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(m.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing || creating} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? 'Edit Item' : 'Add New Item'}</DialogTitle></DialogHeader>
          <MenuItemForm initial={editing || emptyItem} onSave={save} onCancel={() => { setEditing(null); setCreating(false); }}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuItemForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  useEffect(() => { setF(initial); }, [initial]);
  return (
    <div className="space-y-3">
      <div><Label>Name</Label><Input value={f.name} onChange={e => setF({...f, name: e.target.value})}/></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={f.category} onValueChange={v => setF({...f, category: v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Price (₹)</Label><Input type="number" value={f.price} onChange={e => setF({...f, price: Number(e.target.value)})}/></div>
      </div>
      <div><Label>Description</Label><Textarea rows={3} value={f.description} onChange={e => setF({...f, description: e.target.value})}/></div>
      <div><Label>Image URL</Label><Input value={f.image} onChange={e => setF({...f, image: e.target.value})} placeholder="https://…"/></div>
      <div className="flex gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.available} onCheckedChange={v => setF({...f, available: v})}/> Available</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.featured} onCheckedChange={v => setF({...f, featured: v})}/> Featured</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.bestseller} onCheckedChange={v => setF({...f, bestseller: v})}/> Bestseller</label>
      </div>
      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(f)}>Save</Button>
      </DialogFooter>
    </div>
  );
}

function FloatingWhatsApp({ cart, subtotal }) {
  const hasCart = cart && cart.length > 0;
  const handleClick = () => {
    if (hasCart) {
      const tax = subtotal * TAX_RATE;
      const msg = buildWhatsAppOrderMsg({
        customer: {}, items: cart, subtotal,
        deliveryFee: 0, tax, total: subtotal + tax,
        deliveryType: 'pickup', paymentMethod: 'To be confirmed',
      });
      openWhatsApp(msg);
    } else {
      openWhatsApp('Hi Dagadiya Cafe! 👋 I would like to know more.');
    }
  };
  return (
    <button onClick={handleClick}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 h-14 pl-4 pr-5 rounded-full bg-[#25D366] text-white shadow-2xl hover:shadow-xl hover:scale-105 transition-all group"
      aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="currentColor" aria-hidden>
        <path d="M16 3C9 3 3.5 8.6 3.5 15.5c0 2.3.6 4.5 1.8 6.5L3 29l7.3-2.2c1.9 1 4 1.5 6.2 1.5h.1c6.9 0 12.5-5.6 12.5-12.5S23 3 16 3zm7.3 17.8c-.3.9-1.8 1.7-2.5 1.8-.7.1-1.5.2-2.5-.2-.6-.2-1.3-.5-2.3-.9-4-1.7-6.6-5.8-6.8-6-.2-.3-1.6-2.2-1.6-4.2s1-3 1.4-3.4c.4-.4.8-.5 1.1-.5.3 0 .5 0 .8 0 .3 0 .6-.1.9.7.3.9 1.1 3 1.2 3.2.1.2.1.4 0 .7-.1.3-.2.4-.4.7-.2.3-.4.6-.6.8-.2.2-.4.4-.2.8.3.4 1.2 2 2.6 3.2 1.8 1.6 3.4 2.1 3.8 2.3.4.2.7.2 1-.1.3-.3 1.1-1.3 1.4-1.8.3-.5.6-.4.9-.2.3.1 2.3 1.1 2.7 1.3.4.2.6.3.7.4.1.4.1 1.2-.1 2z"/>
      </svg>
      <span className="hidden sm:inline font-medium text-sm">{hasCart ? 'Order on WhatsApp' : 'Chat'}</span>
    </button>
  );
}

function Footer({ go }) {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container px-4 py-14 grid md:grid-cols-4 gap-8">
        <div>
          <img src="/logo.png" alt="Dagadiya Cafe" className="h-20 w-auto rounded-2xl bg-primary-foreground/95 p-1"/>
          <p className="text-primary-foreground/70 text-sm mt-3">Where every cup tells a story. Artisan coffee, handcrafted since 2010.</p>
          <div className="flex gap-2 mt-4">
            <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 grid place-items-center hover:bg-primary-foreground/20"><Instagram className="w-4 h-4"/></a>
            <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 grid place-items-center hover:bg-primary-foreground/20"><Facebook className="w-4 h-4"/></a>
            <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 grid place-items-center hover:bg-primary-foreground/20"><Twitter className="w-4 h-4"/></a>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-3">Explore</div>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><button onClick={() => go('home')} className="hover:text-primary-foreground">Home</button></li>
            <li><button onClick={() => go('menu')} className="hover:text-primary-foreground">Menu</button></li>
            <li><button onClick={() => go('about')} className="hover:text-primary-foreground">About Us</button></li>
            <li><button onClick={() => go('contact')} className="hover:text-primary-foreground">Contact</button></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li className="flex gap-2 items-start"><MapPin className="w-4 h-4 mt-0.5"/> Chowk No.3, Athhoorwala, Uttarakhand</li>
            <li className="flex gap-2 items-center"><Phone className="w-4 h-4"/> +91 83686 00234</li>
            <li className="flex gap-2 items-center"><Mail className="w-4 h-4"/> hello@dagadiyacafe.com</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Hours</div>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li>Mon – Fri · 7:00 AM – 11:00 PM</li>
            <li>Sat – Sun · 8:00 AM – 12:00 AM</li>
          </ul>
          <button onClick={() => go('admin-login')} className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 mt-4">Staff login →</button>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container px-4 py-5 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Dagadiya Cafe Artisan Café. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default App;
