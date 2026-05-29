import SEO from '@/components/SEO'
import { AppIcon, Badge, Card, CardContent } from '@/components/ui'

function LegalSection({ title, children }) {
  return (
    <div className="mb-8 last:mb-0">
      <h2 className="mb-3 text-xl font-extrabold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

function LegalP({ children, className = '' }) {
  return <p className={`text-sm leading-relaxed text-muted-foreground ${className}`}>{children}</p>
}

function LegalList({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <div>
      <SEO
        title="Privacy Policy"
        path="/privacy"
        description="Glowminds Privacy Policy - Learn how we protect your data. We never sell your information. End-to-end encryption, secure payments via Razorpay."
        keywords="Glowminds privacy policy, data protection policy, student data privacy, secure career platform, GDPR compliance India, data security"
      />

      <section className="relative overflow-hidden px-4 pb-10 pt-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center md:px-8">
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            PRIVACY POLICY
          </Badge>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-foreground">
            Your Privacy <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Matters</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">Last updated: May 4, 2026</p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <Card>
            <CardContent className="p-6 md:p-10">
              <LegalSection title="1. Information We Collect">
                <LegalP className="mb-3">We collect information you provide directly to us when you:</LegalP>
                <LegalList
                  items={[
                    'Create an account (name, email, password)',
                    'Build your profile (education, experience, skills)',
                    'Use our services (resumes, job applications, AI interactions)',
                    'Contact us (support requests, feedback)',
                  ]}
                />
                <LegalP className="mt-3">
                  We automatically collect certain information about your device and usage patterns through cookies and similar technologies.
                </LegalP>
              </LegalSection>

              <LegalSection title="2. How We Use Your Information">
                <LegalP className="mb-3">We use the information we collect to:</LegalP>
                <LegalList
                  items={[
                    'Provide, maintain, and improve our services',
                    'Match you with relevant job opportunities',
                    'Generate AI-powered career recommendations',
                    'Send you service updates and notifications',
                    'Respond to your requests and support inquiries',
                    'Protect against fraud and abuse',
                  ]}
                />
              </LegalSection>

              <LegalSection title="3. Information Sharing">
                <LegalP className="mb-3">
                  <strong className="text-foreground">We never sell your personal information.</strong> We may share your information only in these limited circumstances:
                </LegalP>
                <LegalList
                  items={[
                    'With your consent: When you apply to jobs, we share your resume with employers',
                    'Service providers: Third-party vendors who help us operate our platform (hosting, analytics, payment processing)',
                    'Legal requirements: When required by law or to protect our rights',
                  ]}
                />
              </LegalSection>

              <LegalSection title="4. Data Security">
                <LegalP>
                  We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.
                </LegalP>
              </LegalSection>

              <LegalSection title="5. Your Rights">
                <LegalP className="mb-3">You have the right to:</LegalP>
                <LegalList
                  items={[
                    'Access and download your personal data',
                    'Correct inaccurate information',
                    'Delete your account and data',
                    'Opt-out of marketing communications',
                    'Request data portability',
                  ]}
                />
              </LegalSection>

              <LegalSection title="6. Cookies">
                <LegalP>
                  We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can control cookies through your browser settings.
                </LegalP>
              </LegalSection>

              <LegalSection title="7. Children's Privacy">
                <LegalP>Our services are not intended for children under 13. We do not knowingly collect information from children under 13.</LegalP>
              </LegalSection>

              <LegalSection title="8. Changes to This Policy">
                <LegalP>
                  We may update this privacy policy from time to time. We will notify you of significant changes via email or through our platform.
                </LegalP>
              </LegalSection>

              <div className="rounded-xl border border-border bg-muted/50 p-5">
                <h3 className="mb-2 text-lg font-extrabold text-foreground">Contact Us</h3>
                <LegalP>If you have questions about this privacy policy or our data practices, please contact us at:</LegalP>
                <p className="mt-2 text-sm text-primary">privacy@studentsai.in</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  )
}
