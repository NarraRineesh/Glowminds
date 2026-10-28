import SEO from '@/components/SEO'
import {
  PAGE_SEO,
  breadcrumbSchema,
  normalizeStructuredData,
  webPageSchema,
} from '@/config/seo'
import usePricingConfig from '@/hooks/usePricingConfig'
import {
  PublicPageContainer,
  PublicPageHeroBackdrop,
  PublicPageSection,
} from '@/features/public/components/publicPageUi'
import { LEGAL_ADDRESS_ONE_LINE, LEGAL_LEGAL_EMAIL, LEGAL_NAME } from '@/config/legal'
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
  const { marketing } = usePricingConfig()

  return (
    <div>
      <SEO
        {...PAGE_SEO.terms}
        structuredData={normalizeStructuredData([
          webPageSchema({
            name: PAGE_SEO.terms.title,
            description: PAGE_SEO.terms.description,
            path: PAGE_SEO.terms.path,
          }),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'Terms of Service', path: '/terms' },
          ]),
        ])}
      />

      <section className="relative overflow-hidden py-12 md:py-16">
        <PublicPageHeroBackdrop />
        <PublicPageContainer className="relative z-10 text-center">
          <Badge variant="secondary" className="mb-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
            TERMS OF SERVICE
          </Badge>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-foreground">
            Terms & <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Conditions</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">Last updated: May 4, 2026</p>
        </PublicPageContainer>
      </section>

      <PublicPageSection className="pt-0 pb-16 md:pb-20">
        <PublicPageContainer narrow>
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
                  {marketing?.termsBillingText ||
                    'Pro subscriptions are billed at ₹599/year (founding member offer; regular price ₹999/year) or ₹99/month. Payments are processed securely through Razorpay. You can cancel your subscription at any time from your dashboard. Cancellations take effect at the end of the current billing period.'}
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
                <p className="mt-2 text-sm text-primary">{LEGAL_LEGAL_EMAIL}</p>
                <p className="mt-1 text-xs text-muted-foreground">{LEGAL_NAME}<br />{LEGAL_ADDRESS_ONE_LINE}</p>
              </div>
            </CardContent>
          </Card>
        </PublicPageContainer>
      </PublicPageSection>

    </div>
  )
}
