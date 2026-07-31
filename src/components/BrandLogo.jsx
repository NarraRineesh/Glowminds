import { Link } from 'react-router-dom'
import { cn } from '@/components/ui'
import { BRAND_ASSETS } from '@/constants/brandAssets'

/**
 * @param {'icon' | 'mark' | 'full'} variant
 *   icon — square favicon (sidebar, compact)
 *   mark — subtle dark mark
 *   full — theme-aware full logo (light/dark PNG pair); pass forceDark for logo-dark.png only
 */
export function BrandLogo({
  variant = 'icon',
  size = 32,
  className,
  imgClassName,
  alt = 'Glowminds',
  forceDark = false,
}) {
  const px = typeof size === 'number' ? `${size}px` : size

  if (variant === 'full') {
    if (forceDark) {
      return (
        <img
          src={BRAND_ASSETS.logoDark}
          alt={alt}
          width={size}
          height={size}
          className={cn('rounded-xl object-contain', imgClassName, className)}
          style={{ width: px, height: px }}
        />
      )
    }

    return (
      <>
        <img
          src={BRAND_ASSETS.logoLight}
          alt={alt}
          width={size}
          height={size}
          className={cn('rounded-xl object-contain dark:hidden', imgClassName, className)}
          style={{ width: px, height: px }}
        />
        <img
          src={BRAND_ASSETS.logoDark}
          alt={alt}
          width={size}
          height={size}
          className={cn('hidden rounded-xl object-contain dark:block', imgClassName, className)}
          style={{ width: px, height: px }}
        />
      </>
    )
  }

  // Prefer the tiny SVG mark in chrome — favicon-96 PNG is ~12KB for a 32px slot.
  const src = variant === 'mark' ? BRAND_ASSETS.logoMark : BRAND_ASSETS.faviconSvg

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('shrink-0 rounded-lg object-contain', imgClassName, className)}
      style={{ width: px, height: px }}
    />
  )
}

export function GlowmindsWordmark({ className, as: Tag = 'span' }) {
  return (
    <Tag className={cn('truncate font-bold', className)}>
      Glowminds
    </Tag>
  )
}

export function BrandWordmark({ to = '/', className, onClick, showIcon = true, iconSize = 32 }) {
  const label = (
    <>
      {showIcon ? <BrandLogo size={iconSize} className="rounded-lg" /> : null}
      <GlowmindsWordmark className="text-foreground" />
    </>
  )

  const shared = cn('flex min-w-0 items-center gap-2', className)

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={shared}>
        {label}
      </Link>
    )
  }

  return <div className={shared}>{label}</div>
}

export default BrandLogo
