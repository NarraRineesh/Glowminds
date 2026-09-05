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
  const sharedImg = cn(
    'block size-full object-contain',
    variant === 'full' ? 'rounded-xl' : 'rounded-lg',
    imgClassName,
    className,
  )
  const boxStyle = { width: px, height: px }

  const frame = (img) => (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-visible leading-none"
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
