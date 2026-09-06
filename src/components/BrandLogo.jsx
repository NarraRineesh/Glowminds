import { Link } from 'react-router-dom'
import { cn } from '@/components/ui'
import { BRAND_ASSETS } from '@/constants/brandAssets'

/**
 * Theme-aware Glowminds mark for chrome (sidebar, header, footer).
 * Light mode → logo-light.png; dark mode → logo-dark.png.
 * (logo-mark.png is dark-on-dark and disappears on dark surfaces.)
 *
 * @param {'icon' | 'mark' | 'full'} variant — visual size/role only; all use the theme pair
 * @param {boolean} forceDark — always use logo-dark.png (e.g. dark auth panels)
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
  // Inner pad so G/M never sit flush to the rounded frame. Scale with size so
  // 24px footer marks stay readable while 36px chrome gets p-1.5 breathing room.
  const padClass =
    typeof size === 'number'
      ? size >= 36
        ? 'p-1.5'
        : size >= 28
          ? 'p-1'
          : 'p-0.5'
      : 'p-1'
  const sharedImg = cn(
    'block size-full object-contain',
    padClass,
    imgClassName,
    className,
  )
  const boxStyle = { width: px, height: px }

  const frame = (img) => (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden leading-none ring-1 ring-foreground/15',
        variant === 'full' ? 'rounded-xl' : 'rounded-lg',
      )}
      style={boxStyle}
    >
      {img}
    </span>
  )

  if (forceDark) {
    return frame(
      <img
        src={BRAND_ASSETS.logoDark}
        alt={alt}
        width={size}
        height={size}
        className={sharedImg}
      />,
    )
  }

  return frame(
    <>
      <img
        src={BRAND_ASSETS.logoLight}
        alt={alt}
        width={size}
        height={size}
        className={cn(sharedImg, 'dark:hidden')}
      />
      <img
        src={BRAND_ASSETS.logoDark}
        alt={alt}
        width={size}
        height={size}
        className={cn(sharedImg, 'hidden dark:block')}
      />
    </>,
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
