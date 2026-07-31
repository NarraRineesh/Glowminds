import {
  Card as ShadCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from 'glowminds-resume/ui'
import AppIcon from '@/components/icons/AppIcon'

export function DashboardCard({
  title,
  titleIcon,
  description,
  action,
  children,
  className,
  contentClassName,
  footer,
  style,
  id,
}) {
  return (
    <ShadCard id={id} className={cn('w-full min-w-0 gap-0 overflow-hidden py-0', className)} style={style}>
      {(title || action || description) && (
        <CardHeader className="flex-row items-center justify-between gap-3 border-b py-2.5 sm:py-3">
          <div className="min-w-0">
            {title && (
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                {titleIcon && <AppIcon name={titleIcon} className="size-4 text-primary" />}
                {title}
              </CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn('min-w-0 py-4', contentClassName)}>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </ShadCard>
  )
}

export {
  ShadCard as Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
}
