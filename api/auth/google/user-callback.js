// Vercel serverless proxy — receives Google's OAuth redirect and forwards to Railway.
// Registered redirect URI is getautopilot.net so Google shows your domain, not Supabase's.
export default function handler(req, res) {
  const url = new URL(req.url, 'https://www.getautopilot.net')
  const railway = `https://autopilot-production-7671.up.railway.app/api/auth/google/user-callback${url.search}`
  res.redirect(302, railway)
}
