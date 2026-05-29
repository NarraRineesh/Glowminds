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

export default function TermsPage() {
  return (
    <div>
      <SEO
        title="Terms of Service"
        path="/terms"
        description="Glowminds Terms and Conditions for using our AI career platform. Read our service terms, user responsibilities, and policies."
        keywords="Glowminds terms of service, terms and conditions, user agreement, career platform terms, service terms India"
      />

      <section className="relative overflow-hidden px-4 pb-10 pt-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center md:px-8">
          <Badge variant="secondary" className="mb-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
            TERMS OF SERVICE
          </Badge>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-foreground">
            Terms & <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Conditions</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">Last updated: May 4, 2026</p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <Card>
            <CardContent className="p-6 md:p-10">
              <LegalSection title="1. Acceptance of Terms">
                <LegalP>
                  By accessing or using Glowminds, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
                </LegalP>
              </LegalSection>

              <LegalSection title="2. Use License">
                <LegalP className="mb-3">Permission is granted to temporarily use Glowminds for personal, non-commercial purposes. You may not:</LegalP>
                <LegalList
                  items={[
                    'Modify or copy the materials',
                    'Use the materials for commercial purposes',
                    'Attempt to reverse engineer any software',
                    'Remove any copyright or proprietary notations',
                    'Transfer the materials to another person',
                  ]}
                />
              </LegalSection>

              <LegalSection title="3. User Accounts">
                <LegalP>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
                </LegalP>
              </LegalSection>

              <LegalSection title="4. Subscription & Payment">
                <LegalP>
                  Pro subscriptions are billed annually at ₹399/year. Payments are processed securely through Razorpay. You can cancel your subscription at any time from your dashboard. Cancellations take effect at the end of the current billing period.
                </LegalP>
              </LegalSection>

              <LegalSection title="5. Content Ownership">
                <LegalP>
                  You retain all rights to the content you create using Glowminds (resumes, cover letters, etc.). We do not claim ownership of your content. However, you grant us a license to use, store, and process your content to provide our services.
                </LegalP>
              </LegalSection>

              <LegalSection title="6. AI-Generated Content">
                <LegalP>
                  Our AI tools provide suggestions and recommendations. While we strive for accuracy, AI-generated content may contain errors. You are responsible for reviewing and verifying all AI-generated content before use.
                </LegalP>
              </LegalSection>

              <LegalSection title="7. Prohibited Activities">
                <LegalP className="mb-3">You may not:</LegalP>
                <LegalList
                  items={[
                    'Violate any laws or regulations',
                    'Impersonate another person or entity',
                    'Upload malicious code or viruses',
                    'Scrape or harvest data from our platform',
                    'Interfere with the proper functioning of the service',
                  ]}
                />
              </LegalSection>

              <LegalSection title="8. Disclaimer">
                <LegalP>
                  The service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee job placement, interview success, or any specific outcomes. Your success depends on many factors beyond our control.
                </LegalP>
              </LegalSection>

              <LegalSection title="9. Limitation of Liability">
                <LegalP>
                  Glowminds shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
                </LegalP>
              </LegalSection>

              <LegalSection title="10. Termination">
                <LegalP>
                  We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the service will immediately cease.
                </LegalP>
              </LegalSection>

              <div className="rounded-xl border border-border bg-muted/50 p-5">
                <h3 className="mb-2 text-lg font-extrabold text-foreground">Contact Us</h3>
                <LegalP>Questions about these terms? Contact us at:</LegalP>
                <p className="mt-2 text-sm text-primary">legal@studentsai.in</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  )
}
