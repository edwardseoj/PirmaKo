import type { LucideIcon } from "lucide-react"
import "./Startup.css"

interface UserTypeCardProps {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
}

export function UserTypeCard({
  title,
  description,
  icon: Icon,
  onClick,
}: UserTypeCardProps) {
  return (

    <button className="user-card" onClick={onClick} type="button">
      <div className="user-card__icon-wrapper">
        <Icon size={32} strokeWidth={1.5} />
      </div>

      <h2 className="user-card__title">{title}</h2>

      <p className="user-card__description">{description}</p>

      <span className="user-card__arrow">&rarr;</span>
    </button>
  )
}
