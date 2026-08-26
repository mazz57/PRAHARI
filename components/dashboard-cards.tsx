'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cloud, Droplets, Thermometer, Wind, TrendingUp, AlertCircle, BarChart3, Activity } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const weatherData = [
  { temp: 28, time: '6 AM' },
  { temp: 22, time: '9 AM' },
  { temp: 25, time: '12 PM' },
  { temp: 30, time: '3 PM' },
  { temp: 28, time: '6 PM' },
  { temp: 24, time: '9 PM' },
]

const yieldData = [
  { name: 'Week 1', value: 120 },
  { name: 'Week 2', value: 145 },
  { name: 'Week 3', value: 138 },
  { name: 'Week 4', value: 165 },
]

// Health indicator component with animation
function HealthIndicator({ value, label, color = 'primary' }: { value: number; label: string; color?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <motion.span 
          className={`text-sm font-semibold text-${color}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {value}%
        </motion.span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <motion.div 
          className={`bg-${color} h-2.5 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export function WeatherCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            Weather Summary
          </CardTitle>
          <CardDescription>Current conditions & forecast</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Thermometer, label: 'Temperature', value: '28°C', color: 'text-primary' },
              { icon: Droplets, label: 'Humidity', value: '65%', color: 'text-accent' },
              { icon: Wind, label: 'Wind Speed', value: '12 km/h', color: 'text-primary' },
              { icon: Cloud, label: 'Rain Chance', value: '15%', color: 'text-accent' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/50 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function CropHealthCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Crop Health
          </CardTitle>
          <CardDescription>Real-time field condition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <HealthIndicator value={92} label="Soil Health" color="primary" />
          <HealthIndicator value={78} label="Irrigation Status" color="primary" />
          <HealthIndicator value={12} label="Disease Risk" color="accent" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function YieldAnalyticsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Yield Analytics
          </CardTitle>
          <CardDescription>Weekly production trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yieldData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                cursor={{ fill: 'var(--primary)/10' }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function TemperatureTrendCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Temperature Trend
          </CardTitle>
          <CardDescription>Today&apos;s temperature changes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weatherData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                cursor={{ fill: 'var(--primary)/10' }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--primary)', r: 5 }}
                activeDot={{ r: 7 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function MandiInsightsCard() {
  const mandiItems = [
    { name: 'Wheat', price: '₹2,450/q', change: '+2.3%', positive: true },
    { name: 'Rice', price: '₹3,850/q', change: '+1.1%', positive: true },
    { name: 'Corn', price: '₹1,920/q', change: '-0.8%', positive: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-border bg-gradient-to-br from-accent/5 to-transparent hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Mandi Insights
          </CardTitle>
          <CardDescription>Market price trends today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mandiItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="border border-border rounded-lg p-3 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <div className="text-right">
                  <p className="font-bold text-foreground">{item.price}</p>
                  <p className={`text-xs font-semibold ${item.positive ? 'text-primary' : 'text-destructive'}`}>
                    {item.change}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DiseaseAlertCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent" />
            Disease Alert
          </CardTitle>
          <CardDescription>Active monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'Early Blight Risk', status: 'Moderate', severity: 'high' },
            { name: 'Leaf Spot', status: 'Low Risk', severity: 'low' },
          ].map((alert, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-card rounded-lg p-3 border border-border hover:bg-secondary/40 transition-colors ${
                alert.severity === 'high' ? 'border-accent/30' : 'border-primary/20'
              }`}
            >
              <div className="flex items-start gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-2 h-2 rounded-full mt-1 ${
                    alert.severity === 'high' ? 'bg-accent' : 'bg-primary'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.name}: {alert.status}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.severity === 'high' 
                      ? 'Conditions favorable for fungal growth. Apply preventative measures.'
                      : 'Current humidity levels are favorable. Continue monitoring.'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function RecentActivityCard() {
  const activities = [
    { icon: Cloud, label: 'Weather update', time: '2 hours ago' },
    { icon: AlertCircle, label: 'Disease alert received', time: '4 hours ago' },
    { icon: TrendingUp, label: 'Mandi prices updated', time: '30 minutes ago' },
    { icon: Activity, label: 'Soil moisture checked', time: '1 hour ago' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <activity.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.label}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
