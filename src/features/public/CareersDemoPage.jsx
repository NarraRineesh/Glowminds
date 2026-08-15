import SEO from '@/components/SEO'
import { PAGE_SEO, breadcrumbSchema, normalizeStructuredData, organizationSchema, webPageSchema } from '@/config/seo'
import { Button } from '@/components/ui'
import {
  PublicPageContainer,
  PublicPageHeroBackdrop,
} from '@/features/public/components/publicPageUi'

const CAREERS_URL = 'https://careers.glowminds.in'

export default function CareersDemoPage() {
  return (
    <div>
      <SEO
        {...PAGE_SEO.careers}
        structuredData={normalizeStructuredData([
          organizationSchema(),
          webPageSchema({
            name: PAGE_SEO.careers.title,
            description: PAGE_SEO.careers.description,
            path: PAGE_SEO.careers.path,
          }),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'Careers & Internships', path: '/careers' },
          ]),
        ])}
      />

      <section className="relative overflow-hidden border-b border-border py-10 md:py-12">
        <PublicPageHeroBackdrop />
        <PublicPageContainer className="relative z-10">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-primary">Live demo</p>
          <h1 className="mt-2 mb-2 text-3xl font-black tracking-tight md:text-4xl">
            Careers & Internships
          </h1>
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Explore the Glowminds careers board — roles and internships from around the world at careers.glowminds.in.
            Open in a new tab if the embed is blocked by your browser.
          </p>
          <Button
            nativeButton={false}
            render={<a href={CAREERS_URL} target="_blank" rel="noopener noreferrer" />}
          >
            Open careers.glowminds.in
          </Button>
        </PublicPageContainer>
      </section>

      <PublicPageContainer className="py-6 md:py-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <iframe
            title="Glowminds careers and internships"
            src={CAREERS_URL}
            className="h-[min(80vh,720px)] w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </PublicPageContainer>
    </div>
  )
}
