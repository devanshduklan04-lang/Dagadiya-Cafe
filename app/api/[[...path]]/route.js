import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'brew_and_bean';

// Serverless-safe MongoClient caching. In Vercel, functions are re-invoked
// across many warm instances — we MUST cache the client promise on `globalThis`
// so we don't blow through the connection pool and so we don't hit the
// "Topology is closed" error when a lambda instance is reused.
async function getDb() {
  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(MONGO_URL, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      tls: true,
      retryWrites: true,
    });
    globalThis.__mongoClientPromise = client.connect().catch(err => {
      globalThis.__mongoClientPromise = undefined;
      throw err;
    });
  }
  try {
    const client = await globalThis.__mongoClientPromise;
    // Verify the client is still alive with a lightweight ping
    await client.db(DB_NAME).command({ ping: 1 });
    return client.db(DB_NAME);
  } catch (e) {
    // Cached client is dead (topology closed / network drop). Reset and reconnect.
    globalThis.__mongoClientPromise = undefined;
    const client = new MongoClient(MONGO_URL, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      tls: true,
      retryWrites: true,
    });
    globalThis.__mongoClientPromise = client.connect();
    const c = await globalThis.__mongoClientPromise;
    return c.db(DB_NAME);
  }
}

const SEED_MENU = [
  // Coffee
  { name: 'Classic Espresso', category: 'Coffee', price: 120, description: 'A rich shot of pure Arabica espresso with a golden crema.', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Cappuccino', category: 'Coffee', price: 180, description: 'Espresso with silky steamed milk and a thick layer of velvety foam.', image: 'https://images.pexels.com/photos/34255748/pexels-photo-34255748.jpeg?w=800&auto=compress&cs=tinysrgb', available: true, featured: true, bestseller: true },
  { name: 'Café Latte', category: 'Coffee', price: 200, description: 'Smooth espresso layered with steamed milk and delicate latte art.', image: 'https://images.pexels.com/photos/34255748/pexels-photo-34255748.jpeg?w=800&auto=compress&cs=tinysrgb', available: true, featured: true, bestseller: true },
  { name: 'Mocha Deluxe', category: 'Coffee', price: 240, description: 'Espresso, dark chocolate, steamed milk and whipped cream indulgence.', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Americano', category: 'Coffee', price: 150, description: 'A double espresso topped with hot water for a bold, clean cup.', image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },

  // Tea
  { name: 'Masala Chai', category: 'Tea', price: 90, description: 'House-blend spices simmered with assam tea, milk and jaggery.', image: 'https://images.unsplash.com/photo-1557941760-987c3f403d5a?w=800&auto=format&fit=crop&q=80', available: true, featured: true, bestseller: true },
  { name: 'Earl Grey', category: 'Tea', price: 130, description: 'Fragrant black tea infused with bergamot orange oil.', image: 'https://images.unsplash.com/photo-1557941760-987c3f403d5a?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Green Jasmine', category: 'Tea', price: 140, description: 'Delicate green tea scented naturally with jasmine blossoms.', image: 'https://images.unsplash.com/photo-1557941760-987c3f403d5a?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Chamomile Calm', category: 'Tea', price: 130, description: 'Soothing herbal chamomile infusion — caffeine free.', image: 'https://images.unsplash.com/photo-1557941760-987c3f403d5a?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },

  // Cold Beverages
  { name: 'Iced Caramel Latte', category: 'Cold Beverages', price: 220, description: 'Chilled espresso, milk and caramel over crushed ice.', image: 'https://images.unsplash.com/photo-1560100261-226dff8daa82?w=800&auto=format&fit=crop&q=80', available: true, featured: true, bestseller: true },
  { name: 'Cold Brew', category: 'Cold Beverages', price: 210, description: '12-hour slow-steeped cold brew — smooth, chocolatey, low acidity.', image: 'https://images.unsplash.com/photo-1560100261-226dff8daa82?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Iced Mocha', category: 'Cold Beverages', price: 230, description: 'Espresso, cocoa, cold milk and a swirl of whipped cream.', image: 'https://images.unsplash.com/photo-1560100261-226dff8daa82?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Vanilla Frappé', category: 'Cold Beverages', price: 240, description: 'Blended iced coffee with madagascar vanilla and cream.', image: 'https://images.unsplash.com/photo-1560100261-226dff8daa82?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },

  // Snacks
  { name: 'Butter Croissant', category: 'Snacks', price: 110, description: 'Flaky French croissant baked with pure French butter.', image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=800&auto=format&fit=crop&q=80', available: true, featured: true, bestseller: true },
  { name: 'Grilled Panini', category: 'Snacks', price: 220, description: 'Sourdough panini with melted cheese, tomato and pesto.', image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Blueberry Muffin', category: 'Snacks', price: 130, description: 'Bakery-fresh muffin bursting with wild blueberries.', image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Everything Bagel', category: 'Snacks', price: 160, description: 'Toasted bagel with cream cheese and everything seasoning.', image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },

  // Desserts
  { name: 'Tiramisu', category: 'Desserts', price: 260, description: 'Layered mascarpone, espresso-soaked ladyfingers and cocoa dust.', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80', available: true, featured: true, bestseller: true },
  { name: 'New York Cheesecake', category: 'Desserts', price: 280, description: 'Dense, creamy cheesecake on a buttery graham base.', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Chocolate Fudge Brownie', category: 'Desserts', price: 190, description: 'Warm dark chocolate brownie with a gooey molten center.', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
  { name: 'Red Velvet Slice', category: 'Desserts', price: 220, description: 'Classic red velvet with tangy cream cheese frosting.', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80', available: true, featured: false, bestseller: false },
];

async function ensureSeed(db) {
  // Use a marker doc + createIndex to make seeding idempotent even across
  // concurrent cold-start lambdas on Vercel.
  await db.collection('menu').createIndex({ name: 1 }, { unique: true }).catch(() => {});
  const marker = await db.collection('_meta').findOne({ _id: 'seed_v1' });
  if (marker) return;
  try {
    const docs = SEED_MENU.map(m => ({ ...m, id: uuidv4(), createdAt: new Date().toISOString() }));
    // insertMany with ordered:false so duplicates from race conditions are skipped
    await db.collection('menu').insertMany(docs, { ordered: false }).catch(e => {
      if (e.code !== 11000) throw e; // ignore duplicate-key errors only
    });
    await db.collection('_meta').updateOne(
      { _id: 'seed_v1' },
      { $set: { at: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (e) {
    // Swallow — next request will retry. Don't crash the API.
    console.error('Seed error:', e.message);
  }
}

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function stripId(doc) { if (!doc) return doc; const { _id, ...rest } = doc; return rest; }

async function handler(request, ctx) {
  try {
    const db = await getDb();
    await ensureSeed(db);
    const params = await ctx.params;
    const path = (params?.path || []).join('/');
    const method = request.method;
    const url = new URL(request.url);

    // ---- MENU ----
    if (path === 'menu' && method === 'GET') {
      const items = await db.collection('menu').find({}).sort({ createdAt: 1 }).toArray();
      return json(items.map(stripId));
    }
    if (path === 'menu' && method === 'POST') {
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        name: body.name || 'Untitled',
        category: body.category || 'Coffee',
        price: Number(body.price) || 0,
        description: body.description || '',
        image: body.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
        available: body.available !== false,
        featured: !!body.featured,
        bestseller: !!body.bestseller,
        createdAt: new Date().toISOString(),
      };
      await db.collection('menu').insertOne(doc);
      return json(stripId(doc), 201);
    }
    if (path.startsWith('menu/') && method === 'PUT') {
      const id = path.split('/')[1];
      const body = await request.json();
      const update = { ...body };
      delete update._id; delete update.id;
      if (update.price !== undefined) update.price = Number(update.price);
      await db.collection('menu').updateOne({ id }, { $set: update });
      const updated = await db.collection('menu').findOne({ id });
      return json(stripId(updated));
    }
    if (path.startsWith('menu/') && method === 'DELETE') {
      const id = path.split('/')[1];
      await db.collection('menu').deleteOne({ id });
      return json({ ok: true });
    }

    // ---- ORDERS ----
    if (path === 'orders' && method === 'POST') {
      const body = await request.json();
      const orderId = 'BB' + Date.now().toString().slice(-8) + Math.floor(Math.random()*100);
      const doc = {
        id: uuidv4(),
        orderId,
        customer: body.customer || {},
        items: body.items || [],
        subtotal: Number(body.subtotal) || 0,
        deliveryFee: Number(body.deliveryFee) || 0,
        tax: Number(body.tax) || 0,
        total: Number(body.total) || 0,
        deliveryType: body.deliveryType || 'pickup',
        address: body.address || '',
        paymentMethod: body.paymentMethod || 'COD',
        paymentStatus: body.paymentMethod === 'COD' ? 'Pending' : 'Paid',
        status: 'Received',
        createdAt: new Date().toISOString(),
      };
      await db.collection('orders').insertOne(doc);
      return json(stripId(doc), 201);
    }
    if (path === 'orders' && method === 'GET') {
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
      return json(orders.map(stripId));
    }
    if (path.startsWith('orders/') && method === 'PUT') {
      const id = path.split('/')[1];
      const body = await request.json();
      await db.collection('orders').updateOne({ id }, { $set: { status: body.status } });
      const updated = await db.collection('orders').findOne({ id });
      return json(stripId(updated));
    }
    if (path.startsWith('orders/') && method === 'GET') {
      const orderId = path.split('/')[1];
      const order = await db.collection('orders').findOne({ $or: [{ id: orderId }, { orderId }] });
      if (!order) return json({ error: 'Not found' }, 404);
      return json(stripId(order));
    }

    // ---- ANALYTICS ----
    if (path === 'analytics' && method === 'GET') {
      const orders = await db.collection('orders').find({}).toArray();
      const now = new Date();
      const dayMs = 24*60*60*1000;
      const buckets = { today: 0, week: 0, month: 0 };
      const byDay = {};
      const byCategory = {};
      const menu = await db.collection('menu').find({}).toArray();
      const catMap = {}; menu.forEach(m => { catMap[m.id] = m.category; });
      for (const o of orders) {
        const t = new Date(o.createdAt).getTime();
        const diff = now.getTime() - t;
        if (diff <= dayMs) buckets.today += o.total;
        if (diff <= 7*dayMs) buckets.week += o.total;
        if (diff <= 30*dayMs) buckets.month += o.total;
        const dayKey = new Date(o.createdAt).toISOString().slice(0,10);
        byDay[dayKey] = (byDay[dayKey] || 0) + o.total;
        for (const it of (o.items || [])) {
          const cat = catMap[it.id] || 'Other';
          byCategory[cat] = (byCategory[cat] || 0) + (it.price * it.qty);
        }
      }
      const revenueSeries = Object.entries(byDay).sort().slice(-14).map(([date, revenue]) => ({ date: date.slice(5), revenue }));
      const categorySeries = Object.entries(byCategory).map(([category, revenue]) => ({ category, revenue }));
      return json({ totals: buckets, totalOrders: orders.length, revenueSeries, categorySeries });
    }

    // ---- AUTH (simple) ----
    if (path === 'auth/admin' && method === 'POST') {
      const body = await request.json();
      const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
      const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
      if (body.username === ADMIN_USER && body.password === ADMIN_PASS) {
        return json({ ok: true, token: 'admin-' + uuidv4() });
      }
      return json({ ok: false, error: 'Invalid credentials' }, 401);
    }
    if (path === 'auth/signup' && method === 'POST') {
      const body = await request.json();
      const exists = await db.collection('users').findOne({ email: body.email });
      if (exists) return json({ error: 'Email already registered' }, 400);
      const user = { id: uuidv4(), name: body.name, email: body.email, phone: body.phone || '', password: body.password, createdAt: new Date().toISOString() };
      await db.collection('users').insertOne(user);
      const { password, ...safe } = user;
      return json({ ok: true, user: stripId(safe) });
    }
    if (path === 'auth/login' && method === 'POST') {
      const body = await request.json();
      const user = await db.collection('users').findOne({ email: body.email, password: body.password });
      if (!user) return json({ error: 'Invalid credentials' }, 401);
      const { password, _id, ...safe } = user;
      return json({ ok: true, user: safe });
    }
    if (path.startsWith('users/') && path.endsWith('/orders') && method === 'GET') {
      const email = decodeURIComponent(path.split('/')[1]);
      const orders = await db.collection('orders').find({ 'customer.email': email }).sort({ createdAt: -1 }).toArray();
      return json(orders.map(stripId));
    }

    if (path === '' || path === 'health') {
      return json({ status: 'ok', service: 'Dagadiya Cafe API' });
    }

    if (path === 'diag' && method === 'GET') {
      // Diagnostic endpoint — reveals connection details (never expose in real prod)
      const info = {
        node: process.version,
        env_mongo_url_set: !!process.env.MONGO_URL,
        env_mongo_url_starts: process.env.MONGO_URL?.slice(0, 25) + '...',
        env_db_name: process.env.DB_NAME,
        env_admin_user_set: !!process.env.ADMIN_USERNAME,
        env_admin_pw_set: !!process.env.ADMIN_PASSWORD,
      };
      try {
        const pingStart = Date.now();
        const db2 = await getDb();
        const ping = await db2.command({ ping: 1 });
        info.ping_ms = Date.now() - pingStart;
        info.ping = ping;
        info.collections = (await db2.listCollections().toArray()).map(c => c.name);
        info.menu_count = await db2.collection('menu').countDocuments();
      } catch (e) {
        info.error = e.message;
        info.error_name = e.name;
        info.error_code = e.code;
      }
      return json(info);
    }

    return json({ error: 'Not found', path }, 404);
  } catch (e) {
    console.error('API error:', e);
    return json({ error: e.message || 'Server error' }, 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
