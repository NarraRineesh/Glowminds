import { useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'
import { LEGAL_NAME } from '@/config/legal'
import {
  PublicPageContainer,
  PublicPageHeroBackdrop,
  PublicPageSection,
} from '@/features/public/components/publicPageUi'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

export default function CareersPage() {
  const navigate = useNavigate()

  return (
    <div>
      <SEO
        title="We're hiring"
        description="Join the Glowminds team. This is our company careers page — not the student job board."
        path="/careers"
      />
      <section className="relative overflow-hidden py-12 md:py-16">
        <PublicPageHeroBackdrop />
        <PublicPageContainer className="relative z-10 text-center">
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            WE&apos;RE HIRING
          </Badge>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-foreground">
            Work at <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Glowminds</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Company roles at {LEGAL_NAME}. Looking for internships or fresher jobs? Use the student job board after you sign up.
          </p>
        </PublicPageContainer>
      </section>
      <PublicPageSection className="pt-0 pb-16">
        <PublicPageContainer>
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle>No open roles right now</CardTitle>
              <CardDescription>
                We&apos;re a small team. When we hire, we&apos;ll list roles here — never as a live demo of the student job board.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/contact')}>Contact us</Button>
              <Button variant="outline" onClick={() => navigate('/signup')}>Student job search</Button>
            </CardContent>
          </Card>
        </PublicPageContainer>
      </PublicPageSection>
    </div>
  )
}
