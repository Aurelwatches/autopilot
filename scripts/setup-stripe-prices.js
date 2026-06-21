#!/usr/bin/env node
// Run once: node scripts/setup-stripe-prices.js
// Creates all Stripe products + prices and prints the IDs to paste into .env / Railway

import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.startsWith('sk_test_...')) {
  console.error('❌ Set STRIPE_SECRET_KEY env var first:\n  STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe-prices.js')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

const plans = [
  { name: 'AutoPilot Starter', key: 'starter', monthly: 9900, yearly: 99900 },
  { name: 'AutoPilot Growth',  key: 'growth',  monthly: 20000, yearly: 200000 },
  { name: 'AutoPilot Pro',     key: 'pro',     monthly: 35000, yearly: 350000 },
]

async function run() {
  console.log('Creating Stripe products and prices...\n')
  const results = {}

  for (const plan of plans) {
    const product = await stripe.products.create({ name: plan.name, metadata: { plan: plan.key } })

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthly,
      currency: 'usd',
      recurring: { interval: 'month' },
      nickname: `${plan.name} Monthly`,
    })

    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.yearly,
      currency: 'usd',
      recurring: { interval: 'year' },
      nickname: `${plan.name} Yearly`,
    })

    results[plan.key] = { monthly: monthlyPrice.id, yearly: yearlyPrice.id }
    console.log(`✅ ${plan.name}`)
    console.log(`   Monthly: ${monthlyPrice.id}`)
    console.log(`   Yearly:  ${yearlyPrice.id}\n`)
  }

  console.log('─────────────────────────────────────────────')
  console.log('Paste these into Railway + .env:\n')
  for (const [key, ids] of Object.entries(results)) {
    const K = key.toUpperCase()
    console.log(`STRIPE_PRICE_${K}_MONTHLY=${ids.monthly}`)
    console.log(`STRIPE_PRICE_${K}_YEARLY=${ids.yearly}`)
  }
}

run().catch(err => { console.error('Error:', err.message); process.exit(1) })
