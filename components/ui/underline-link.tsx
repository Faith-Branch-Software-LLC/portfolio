/**
 * A link component with an animated underline effect that appears on hover
 */
export default function UnderlineLink({
  href,
  icon: Icon,
  children,
  className = "",
  iconSize = 32,
  color = "white",
}: {
  href: string
  icon?: React.ComponentType<{ size?: number }>
  children: React.ReactNode
  iconSize?: number
  className?: string
  color?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      className={`flex items-center gap-2 hover:opacity-80 w-fit group relative ${className}`}
    >
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
    </a>
  )
} 