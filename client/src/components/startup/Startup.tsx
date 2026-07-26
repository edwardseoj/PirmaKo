import { FileText, PenLine } from "lucide-react"
import { Navbar } from "../shared/Navbar"
import { UserTypeCard } from "./UserTypeCard"
import "./Startup.css"

interface StartupProps {

  onRequesterClick?: () => void

  onSignerClick?: () => void
}

export function Startup({ onRequesterClick, onSignerClick }: StartupProps = {}) {
  return (
    <div className="startup">
      <Navbar />

      <main className="startup__main">
        <div className="startup__header">
          <h1 className="startup__heading">Welcome to PirmaKo</h1>
          <p className="startup__subtitle">
            Choose your role to get started
          </p>
        </div>

        <div className="startup__cards">
          <UserTypeCard
            title="Requester"
            description="Request documents for signature and track their status"
            icon={FileText}
            onClick={onRequesterClick ?? (() => {})}
          />

          <UserTypeCard
            title="Signer"
            description="Review and sign documents sent to you for approval"
            icon={PenLine}
            onClick={onSignerClick ?? (() => {})}
          />
        </div>
      </main>
    </div>
  )
}
