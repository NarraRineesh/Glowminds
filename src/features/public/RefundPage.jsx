import SEO from '@/components/SEO'
import {
  PAGE_SEO,
  breadcrumbSchema,
  normalizeStructuredData,
  webPageSchema,
} from '@/config/seo'
import {
  PublicPageContainer,
  PublicPageHeroBackdrop,
  PublicPageSection,
} from '@/features/public/components/publicPageUi'
import { Badge, Card, CardContent } from '@/components/ui'

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

export default function RefundPage() {
  return (
    <div>
      <SEO
        {...PAGE_SEO.refund}
        structuredData={normalizeStructuredData([
          webPageSchema({
            name: PAGE_SEO.refund.title,
            description: PAGE_SEO.refund.description,
            path: PAGE_SEO.refund.path,
          }),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'Refund Policy', path: '/refund' },
          ]),
        ])}
      />

      <section className="relative overflow-hidden py-12 md:py-16">
        <PublicPageHeroBackdrop />
        <PublicPageContainer className="relative z-10 text-center">
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            REFUND POLICY
          </Badge>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-foreground">
            Refund <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">Last updated: May 4, 2026</p>
        </PublicPageContainer>
      </section>

      <PublicPageSection className="pt-0 pb-16 md:pb-20">
        <PublicPageContainer narrow>
          <Card>
            <CardContent className="p-6 md:p-10">
              <LegalSection title="1. Overview">
                <LegalP className="mb-3">
                  Glowminds Pro is a digital subscription service. Because access is delivered immediately after payment,
                  refunds are limited to the cases described below.
                </LegalP>
              </LegalSection>

              <LegalSection title="2. Eligibility">
                <LegalList
                  items={[
                    'Duplicate charges or billing errors verified by our payment provider (Razorpay)',
                    'Technical issues that prevent Pro access for more than 72 consecutive hours after we confirm the issue',
                    'Accidental purchase reported within 48 hours, before substantial Pro feature usage',
                  ]}
                />
              </LegalSection>

              <LegalSection title="3. Non-refundable cases">
                <LegalList
                  items={[
                    'Change of mind after using Pro features (AI Coach, Interview Prep, exports, etc.)',
                    'Partial use of the billing period after the 48-hour accidental-purchase window',
                    'Failure to cancel before renewal — you retain access until the period ends',
                  ]}
                />
              </LegalSection>

              <LegalSection title="4. How to request a refund">
                <LegalP className="mb-3">
                  Email{' '}
                  <a href="mailto:support@glowminds.in" className="font-semibold text-primary hover:underline">
                    support@glowminds.in
                  </a>{' '}
                  from your account email with your Razorpay payment ID, purchase date, and reason. We respond within 3–5 business days.
                </LegalP>
              </LegalSection>

              <LegalSection title="5. Processing time">
                <LegalP>
                  Approved refunds are initiated to the original payment method within 5–10 business days. Bank/UPI settlement times may vary.
                </LegalP>
              </LegalSection>

              <LegalSection title="6. Contact">
                <LegalP>
                  Questions about billing or refunds? Visit our{' '}
                  <a href="/contact" className="font-semibold text-primary hover:underline">Contact page</a>{' '}
                  or email support@glowminds.in.
                </LegalP>
              </LegalSection>
            </CardContent>
          </Card>
        </PublicPageContainer>
      </PublicPageSection>
    </div>
  )
}
