import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import { Button, Card, CardContent } from '@/components/ui'

export default function NotFoundPage() {
  return (
    <>
      <SEO
        title="Page Not Found"
        path="/404"
        description="The page you are looking for does not exist or has been moved."
        noIndex
      />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <Card className="max-w-md border-border text-center">
          <CardContent className="py-10">
            <p className="mb-3 text-6xl font-black tabular-nums text-primary">404</p>
            <h1 className="mb-2 text-xl font-bold text-foreground">Page not found</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              That link may be broken or the page was removed. Head home or open your dashboard if you are signed in.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button render={<Link to="/" />}>Back home</Button>
              <Button variant="outline" render={<Link to="/dashboard" />}>Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
