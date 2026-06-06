import { Link } from 'react-router-dom'
import LegalLayout, { LSection } from '../components/LegalLayout'

const CONTACT_EMAIL = 'hello@useautopilot.com'

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="June 5, 2026">
      <p className="text-sm leading-relaxed mb-8" style={{ color: '#888780' }}>
        These Terms of Service ("Terms") govern your access to and use of AutoPilot. By creating an
        account or using the service, you agree to these Terms. If you do not agree, do not use the service.
      </p>

      <LSection n="1" title="Description of Service">
        <p>
          AutoPilot is a software service for restaurants that uses automation and artificial
          intelligence to help draft replies to customer reviews, generate and schedule social media
          posts, and send customer follow-up messages. Features may change, improve, or be discontinued
          over time.
        </p>
      </LSection>

      <LSection n="2" title="No Guarantee of Results">
        <p>
          AutoPilot uses AI to generate content. AI output may be inaccurate, incomplete, or otherwise
          imperfect. We do not guarantee any particular results, increase in reviews, ratings, traffic,
          or revenue. <strong>You are responsible for reviewing all AI-generated content before it is
          published or sent</strong>, and you remain solely responsible for what is posted under your
          accounts.
        </p>
      </LSection>

      <LSection n="3" title="Your Accounts and Responsibilities">
        <p>
          You are responsible for your own Google Business Profile, social media, and other connected
          accounts, including compliance with their terms and policies and for any content published
          through them. You are responsible for maintaining the confidentiality of your AutoPilot login
          credentials and for all activity under your account.
        </p>
      </LSection>

      <LSection n="4" title="Acceptable Use & Termination">
        <p>
          You agree not to misuse the service, including using it for unlawful, deceptive, abusive, or
          infringing purposes. We may suspend or cancel accounts that violate these Terms or applicable
          law, with or without notice. You may cancel your account at any time.
        </p>
      </LSection>

      <LSection n="5" title="Payment Terms">
        <p>
          AutoPilot is offered on a subscription basis at <strong>$200 per month</strong>, billed in
          advance. Subscriptions renew automatically until cancelled. You may request a refund within
          the first <strong>30 days</strong> of your initial subscription;{' '}
          <strong>no refunds are provided after 30 days</strong>, including for partial billing periods.
          Cancelling stops future charges but does not refund amounts already paid beyond the 30-day window.
        </p>
      </LSection>

      <LSection n="6" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, AutoPilot and its owners, employees, and suppliers will
          not be liable for any indirect, incidental, special, consequential, or punitive damages, or for
          any loss of profits, revenue, data, or goodwill, arising out of or related to your use of (or
          inability to use) the service. Our total aggregate liability for any claim relating to the
          service will not exceed the amount you paid us in the three (3) months preceding the claim. The
          service is provided "as is" and "as available" without warranties of any kind, express or implied.
        </p>
      </LSection>

      <LSection n="7" title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. Material changes will be reflected by the
          "Last updated" date above, and continued use of the service constitutes acceptance of the
          updated Terms.
        </p>
      </LSection>

      <LSection n="8" title="Governing Law">
        <p>
          These Terms are governed by the laws of the State of North Carolina, United States, without
          regard to its conflict-of-laws principles. Any disputes will be subject to the exclusive
          jurisdiction of the state and federal courts located in North Carolina.
        </p>
      </LSection>

      <LSection n="9" title="Contact Us">
        <p>
          Questions about these Terms? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#4A90D9' }}>{CONTACT_EMAIL}</a>.
          See also our{' '}
          <Link to="/privacy" style={{ color: '#4A90D9' }}>Privacy Policy</Link>.
        </p>
      </LSection>
    </LegalLayout>
  )
}
