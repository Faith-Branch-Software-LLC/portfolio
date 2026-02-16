import { Link as TransitionLink } from "next-transition-router"

/**
 * A link component with an animated underline effect that appears on hover.
 * Uses TransitionLink for internal routes, plain <a> for external URLs.
 */
export default function UnderlineLink({
  href,
  icon: Icon,
  children,
  className = "",
  iconSize = 32,
  color = "white",
  external,
}: {
  href: string
  icon?: React.ComponentType<{ size?: number }>
  children: React.ReactNode
  iconSize?: number
  className?: string
  color?: string
  external?: boolean
}) {
  const isExternal = external ?? !href.startsWith("/")

  const inner = (
    <>
      {Icon && <Icon size={iconSize} />}
      <span
        className="after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:origin-right after:transition-transform after:duration-300 group-hover:after:scale-x-100 group-hover:after:origin-left"
        style={{ '--underline-color': color } as React.CSSProperties}
      >
        <style jsx>{`
          span::after {
            background-color: var(--underline-color);
          }
        `}</style>
        {children}
      </span>
    </>
  )

  const linkClass = `flex items-center gap-2 hover:opacity-80 w-fit group relative ${className}`

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {inner}
      </a>
    )
  }

  return (
    <TransitionLink href={href} className={linkClass}>
      {inner}
    </TransitionLink>
  )
}
