# ☕ Dagadiya Cafe

A modern, premium café website — Next.js 15 + MongoDB. Order online for pickup or delivery, with a full admin dashboard for menu management, orders, and revenue analytics.

**Live site:** https://websitebanao.co.in

---

## ✨ Features

- 🏠 Beautiful home, menu, about & contact pages
- 🛒 Cart + checkout with pickup / home delivery
- 💬 **WhatsApp Orders** — every order lands in the café's WhatsApp with full details
- 👤 Customer signup / login / order history
- 🔐 Admin dashboard with menu CRUD, live orders, revenue charts
- 📱 Fully responsive with PWA icons for Add-to-Home-Screen

## 🛠 Tech stack

- Next.js 15 (App Router)
- Tailwind CSS + shadcn/ui
- MongoDB (via native driver)
- Recharts for analytics
- Lucide icons + Playfair Display + Inter typography

## 🚀 Deploy on Vercel

1. Import this repo into Vercel
2. Add these environment variables in Vercel → Project → Settings → Environment Variables:

```
MONGO_URL=<your MongoDB Atlas connection string>
DB_NAME=dagadiya_cafe
NEXT_PUBLIC_BASE_URL=https://websitebanao.co.in
ADMIN_USERNAME=Dagadiya_Admin
ADMIN_PASSWORD=<your strong password>
CORS_ORIGINS=*
```

3. Deploy — Vercel auto-detects Next.js and does the rest.

## 🔑 Admin login

Footer → **Staff login** → enter the credentials set in Vercel env vars.

---

Built with ❤️ for Dagadiya Cafe.
