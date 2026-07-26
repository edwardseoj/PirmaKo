/**
 * UserTypeCard — A clickable card button for selecting a user type.
 *
 * What it does:
 * - Displays a large, rounded card with an icon, title, and description.
 * - Has hover and click animations (scale, glow effect).
 * - Shows a toast notification when clicked.
 *
 * Props:
 *   - title: The user type name (e.g., "Requester" or "Signer").
 *   - description: A short explanation of what this user type does.
 *   - icon: The Lucide icon component to display.
 *   - onClick: Function to call when the card is clicked.
 */
import type { LucideIcon } from "lucide-react"
import "./Startup.css"

/* TypeScript type definition for the component's props */
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
    /* The outer card wrapper — handles hover effects and click */
    <button className="user-card" onClick={onClick} type="button">
      {/* Icon container with background glow */}
      <div className="user-card__icon-wrapper">
        <Icon size={32} strokeWidth={1.5} />
      </div>

      {/* Title text */}
      <h2 className="user-card__title">{title}</h2>

      {/* Description text */}
      <p className="user-card__description">{description}</p>

      {/* Arrow hint — appears on hover */}
      <span className="user-card__arrow">&rarr;</span>
    </button>
  )
}
