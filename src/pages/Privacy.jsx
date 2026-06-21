import { Link } from 'react-router-dom'
import LegalLayout, { LSection } from '../components/LegalLayout'

const PRIVACY_EMAIL = 'privacy@getautopilot.net'

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 21, 2026">
      <p className="text-sm leading-relaxed mb-8" style={{ color: '#94A3B8' }}>
        This Privacy Policy explains how AutoPilot ("AutoPilot", "we", "us", or "our") collects,
        uses, and protects information when you use our service. We are committed to handling your
        data responsibly and in compliance with the EU General Data Protection Regulation (GDPR) and
        the California Consumer Privacy Act (CCPA).
      </p>

      <LSection n="1" title="Information We Collect">
        <p>We collect only the information needed to operate the service:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account information</strong> — your email address and business (restaurant) name.</li>
          <li><strong>Review data</strong> — customer reviews and the AI-generated replies we produce for them.</li>
          <li><strong>Messages</strong> — customer messages and the replies sent through the service.</li>
          <li><strong>Usage data</strong> — basic technical information (such as activity timestamps) needed to provide and secure the service.</li>
        </ul>
      </LSection>

      <LSection n="2" title="How We Use Your Information">
        <p>
          We use your information solely to provide, maintain, and improve the AutoPilot service —
          including generating review replies, scheduling social posts, sending customer follow-ups,
          and supporting your account. We do not use your data for advertising.
        </p>
      </LSection>

      <LSection n="3" title="We Never Sell Your Data">
        <p>
          We do not and will never sell, rent, or trade your personal information to third parties.
          We share data only with the service providers strictly necessary to run AutoPilot (for
          example, our hosting, database, and AI processing providers), and only to the extent needed
          to deliver the service to you.
        </p>
      </LSection>

      <LSection n="4" title="Your Rights (GDPR & CCPA)">
        <p>
          Depending on where you live, you have rights over your personal information. Under the GDPR,
          you may access, correct, export (data portability), restrict, or erase your personal data,
          and object to certain processing. Under the CCPA, you have the right to know what personal
          information we collect, to request its deletion, and to not be discriminated against for
          exercising these rights. Because we do not sell personal information, there is no need to
          "opt out of sale."
        </p>
        <p>
          To exercise any of these rights, email us at{' '}
          <a href={`mailto:${PRIVACY_EMAIL}`} style={{ color: 'var(--ap-accent)' }}>{PRIVACY_EMAIL}</a>.
          We will respond within the timeframes required by applicable law.
        </p>
      </LSection>

      <LSection n="5" title="How to Request Deletion">
        <p>
          You can request deletion of your account and associated data at any time by emailing{' '}
          <a href={`mailto:${PRIVACY_EMAIL}`} style={{ color: 'var(--ap-accent)' }}>{PRIVACY_EMAIL}</a>{' '}
          from the email address associated with your account. We will permanently delete your personal
          data, except where we are required to retain certain records to comply with legal obligations.
        </p>
      </LSection>

      <LSection n="6" title="Data Retention & Security">
        <p>
          We retain your information for as long as your account is active or as needed to provide the
          service, and we apply reasonable technical and organizational measures to protect it. No method
          of transmission or storage is completely secure, but we work to safeguard your data.
        </p>
      </LSection>

      <LSection n="7" title="Children's Privacy">
        <p>
          AutoPilot is a business tool not directed to children under 16, and we do not knowingly collect
          personal information from them.
        </p>
      </LSection>

      <LSection n="8" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by the
          "Last updated" date above, and continued use of the service constitutes acceptance of the
          updated policy.
        </p>
      </LSection>

      <LSection n="9" title="Governing Law">
        <p>
          This Privacy Policy is governed by the laws of the State of North Carolina, United States,
          without regard to its conflict-of-laws principles.
        </p>
      </LSection>

      <LSection n="10" title="Contact Us">
        <p>
          Questions about this policy or your data? Email{' '}
          <a href={`mailto:${PRIVACY_EMAIL}`} style={{ color: 'var(--ap-accent)' }}>{PRIVACY_EMAIL}</a>.
          See also our{' '}
          <Link to="/terms" style={{ color: 'var(--ap-accent)' }}>Terms of Service</Link>.
        </p>
      </LSection>
    </LegalLayout>
  )
}
