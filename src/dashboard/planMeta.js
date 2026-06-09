// Shared plan metadata — keeps the plan name, price, and accent color
// consistent across the sidebar, overview, subscription, and settings.
export const PLAN_META = {
  starter: {
    key: 'starter', label: 'Starter', emoji: '',
    blurb: 'For restaurants just getting started',
    monthly: 99, yearly: 999,
    color: 'var(--ap-text2)',
    pillBg: 'rgba(136,135,128,0.14)', pillBorder: 'rgba(136,135,128,0.28)',
  },
  growth: {
    key: 'growth', label: 'Growth', emoji: '⚡',
    blurb: 'For restaurants ready to automate',
    monthly: 200, yearly: 2000,
    color: '#4A8EFF',
    pillBg: 'rgba(74,142,255,0.14)', pillBorder: 'rgba(74,142,255,0.30)',
  },
  pro: {
    key: 'pro', label: 'Pro', emoji: '🚀',
    blurb: 'For restaurants that want everything',
    monthly: 350, yearly: 3500,
    color: '#F59E0B',
    pillBg: 'rgba(245,158,11,0.14)', pillBorder: 'rgba(245,158,11,0.30)',
  },
}

export function getPlanMeta(plan) {
  return PLAN_META[plan] || PLAN_META.starter
}

// Billing interval chosen at checkout (persisted in localStorage)
export function getBillingInterval() {
  return localStorage.getItem('ap_selected_interval') === 'yearly' ? 'yearly' : 'monthly'
}

export function planPrice(meta, interval) {
  return interval === 'yearly' ? meta.yearly : meta.monthly
}
