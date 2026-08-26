# AgroAI — Hackathon Feature Overview

AgroAI is an AI-powered agricultural advisory platform built to help farmers across India make smarter, data-driven decisions. It combines crop intelligence, disease monitoring, market insights, and a voice assistant into a single accessible interface.

---

## Core Features

### 1. AI Crop Recommendation
Recommends the best crops to grow based on soil type, local weather conditions, and historical yield data. Accessible from the `/crops` route via the sidebar.

### 2. Crop Disease Detection
Allows farmers to identify crop diseases early using image-based AI analysis. Reduces crop loss by flagging threats like Early Blight and Leaf Spot before they spread. Accessible at `/disease-detection`.

### 3. Mandi Price Insights
Displays real-time agricultural market (mandi) prices with trend indicators. Farmers can track price changes for crops like Wheat, Rice, and Corn to choose the best time and place to sell. Accessible at `/mandi-prices`.

### 4. Voice Assistant
A floating chat panel with voice input support. Farmers can ask questions in natural language and receive farming advice, crop tips, or current market prices. Designed for low-literacy accessibility.

### 5. Farm Dashboard
A central hub at `/dashboard` showing:
- **Weather Summary** — temperature, humidity, wind speed, and rain chance
- **Crop Health** — soil health, irrigation status, and disease risk gauges
- **Yield Analytics** — weekly production bar chart
- **Temperature Trend** — intraday line chart
- **Mandi Insights** — live price cards with change indicators
- **Disease Alerts** — active monitoring with severity levels
- **Recent Activity** — timeline of the latest farm events

### 6. Multi-language Support
Language switcher in the navbar supports English, Hindi (हिंदी), and Kannada (ಕನ್ನಡ), making the platform accessible to regional farmers across India.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |
| Language | TypeScript |

---

## Key Stats (Platform Goals)

| Metric | Target |
|--------|--------|
| Active Farmers | 50,000+ |
| Crops Monitored | 200+ |
| Daily AI Predictions | 1,000,000+ |
| Average Yield Increase | 35% |

---

## Pages & Navigation

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, stats, features, and testimonials |
| `/dashboard` | Main farm analytics dashboard |
| `/crops` | AI crop recommendation engine |
| `/disease-detection` | Image-based disease detection |
| `/mandi-prices` | Live market price tracker |
| `/settings` | User account settings |
