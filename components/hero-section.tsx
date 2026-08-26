'use client'

import { Leaf, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'

export function HeroSection() {
  return (
    <section className="relative py-16 md:py-28 overflow-hidden bg-gradient-to-b from-primary/8 via-transparent to-transparent">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-10 left-10 w-60 h-60 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4 border border-primary/20">
                🌱 Smart Farming Technology
              </span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              AI-Powered Agricultural Advisory
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
              Get real-time crop recommendations, disease detection, mandi price insights, and personalized farming advice powered by advanced AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  Start Farming Smarter
                </Button>
              </Link>
              <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-base font-semibold border-primary/20">
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Right: Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/agriculture-hero.jpg"
                alt="Modern farming with AI technology"
                width={500}
                height={400}
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating feature cards */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -left-6 bottom-12 bg-card rounded-xl p-4 border border-border shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <Leaf className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Crop Health</p>
                  <p className="text-sm font-semibold text-foreground">92% Optimal</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              className="absolute -right-6 top-12 bg-card rounded-xl p-4 border border-border shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Yield Increase</p>
                  <p className="text-sm font-semibold text-foreground">+35% YoY</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export function StatsSection() {
  const stats = [
    { icon: Users, label: 'Active Farmers', value: '50K+', color: 'text-primary' },
    { icon: Leaf, label: 'Crops Monitored', value: '200+', color: 'text-accent' },
    { icon: Zap, label: 'Predictions Daily', value: '1M+', color: 'text-primary' },
    { icon: TrendingUp, label: 'Avg Yield Increase', value: '35%', color: 'text-accent' },
  ]

  return (
    <section className="py-16 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="mb-3"
              >
                <stat.icon className={`w-10 h-10 ${stat.color} mx-auto`} />
              </motion.div>
              <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</p>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TrustedBySection() {
  const testimonials = [
    { name: 'Rajesh Kumar', farm: 'Haryana', text: 'Increased my wheat yield by 40% in just one season. PRAVAAH is a game-changer!' },
    { name: 'Priya Sharma', farm: 'Punjab', text: 'The disease detection saved my rice crop from early blight. Worth every rupee.' },
    { name: 'Vikram Singh', farm: 'Madhya Pradesh', text: 'Real-time mandi prices help me get the best market rates for my produce.' },
  ]

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Thousands of Farmers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real success stories from farmers across India using PRAVAAH to transform their farming
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-accent">★</span>
                ))}
              </div>
              <p className="text-foreground mb-4 leading-relaxed">"{testimonial.text}"</p>
              <div className="pt-4 border-t border-border">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.farm}, India</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeaturesSection() {
  const features = [
    {
      icon: Leaf,
      title: 'Crop Recommendation',
      description: 'Get AI-powered recommendations based on soil type, weather, and historical data.',
    },
    {
      icon: Users,
      title: 'Disease Detection',
      description: 'Identify crop diseases early with image-based AI analysis.',
    },
    {
      icon: TrendingUp,
      title: 'Mandi Prices',
      description: 'Real-time agricultural market prices and price trends.',
    },
    {
      icon: Zap,
      title: 'Voice Assistant',
      description: 'Get farming advice in your preferred language via voice.',
    },
  ]

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Modern Farming
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to optimize your farm operations and increase productivity
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
