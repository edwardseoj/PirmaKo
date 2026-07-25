# PirmaKo Startup Screen — Code Documentation

## Overview

This document describes the PirmaKo startup screen — the landing page users see when opening the application. It's built with React 19, TypeScript, Vite, Tailwind CSS, and Sonner (for toast notifications).

---

## Project Structure

```
src/
├── components/
│   ├── startup/
│   │   ├── Startup.tsx    ← Main startup screen (layout + logic)
│   │   ├── Startup.css    ← All styles for the startup screen
│   │   ├── Navbar.tsx     ← Top navigation bar with icon + brand
│   │   └── UserTypeCard.tsx ← Clickable card for selecting a role
│   └── ui/
│       └── sonner.tsx     ← Toast notification provider
├── lib/
│   └── utils.ts           ← Utility functions (class name merging)
├── App.tsx                ← Root component (renders Startup + Toaster)
├── App.css                ← Global app styles (currently empty)
├── index.css              ← Global styles + Tailwind import
└── main.tsx               ← Entry point (mounts React to DOM)
```

---

## File-by-File Explanation

### `src/main.tsx` — Entry Point

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**What it does:**
- `createRoot` — React 19's way to start a React app (replaces the old `ReactDOM.render`).
- `StrictMode` — A React tool that highlights potential problems in development (like using deprecated APIs).
- `import './index.css'` — Loads our global styles (including Tailwind CSS) before the app renders.
- `document.getElementById('root')` — Finds the `<div id="root">` in `index.html` and renders our app inside it.

---

### `src/index.css` — Global Styles + Tailwind

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**What each part does:**
- `@import "tailwindcss"` — Imports the entire Tailwind CSS utility library. This gives you utility classes like `flex`, `p-4`, `rounded-lg`, etc.
- `color-scheme: dark` — Tells the browser this page uses dark mode. This affects scrollbars, form controls, and other OS-level UI.
- `font-family` — Sets the default font for the entire app. `system-ui` means it uses the operating system's default font.
- `-webkit-font-smoothing` — Makes text look sharper on Mac/iOS.
- The `*` selector with `box-sizing: border-box` — Ensures padding and borders are included in element widths (standard CSS reset).

---

### `src/lib/utils.ts` — Utility Functions

```tsx
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**What it does:**
- This is a standard helper used by shadcn/ui projects.
- `clsx` — Merges multiple class names into one string. Example: `clsx("px-4", isActive && "bg-blue-500")` → `"px-4 bg-blue-500"` (only if `isActive` is true).
- `twMerge` — Resolves conflicts between Tailwind classes. Example: `twMerge("px-4 px-8")` → `"px-8"` (the second one wins).
- `cn()` — Combines both: takes any number of class inputs, merges them with `clsx`, then resolves Tailwind conflicts with `twMerge`.

---

### `src/components/ui/sonner.tsx` — Toast Notification Provider

```tsx
import { Toaster } from "sonner"

export function SonnerToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "#1e1e2e",
          border: "1px solid #313244",
          color: "#cdd6f4",
        },
      }}
    />
  )
}
```

**What it does:**
- Wraps the `sonner` library's `<Toaster>` component with PirmaKo-specific styling.
- `theme="dark"` — Uses dark mode colors.
- `position="bottom-center"` — Toast notifications appear at the bottom center of the screen.
- `richColors` — Shows colored icons (green for success, red for error, etc.).
- `closeButton` — Adds an X button to dismiss notifications.
- `toastOptions.style` — Custom background, border, and text colors matching the app's dark theme.

**How to use toast notifications anywhere in the app:**
```tsx
import { toast } from "sonner"

// Simple message
toast("Hello!")

// Success notification
toast.success("Saved!")

// With description
toast.info("Check this out", {
  description: "More details here",
  duration: 3000,  // Auto-dismiss after 3 seconds
})
```

---

### `src/components/startup/Navbar.tsx` — Navigation Bar

```tsx
import { Signature } from "lucide-react"
import "./Startup.css"

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__icon">
        <Signature size={24} strokeWidth={1.75} />
      </div>
      <span className="navbar__title">PirmaKo</span>
    </nav>
  )
}
```

**What it does:**
- Renders a sticky navigation bar at the top of the screen.
- `Signature` — A Lucide icon that looks like a handwritten signature (fitting for a document signing app).
- `size={24}` — Sets the icon to 24x24 pixels.
- `strokeWidth={1.75}` — Controls the thickness of the icon's lines.
- `className="navbar"` — Applies CSS styles defined in `Startup.css`.
- `position: sticky` + `top: 0` in CSS — Makes the navbar stay visible when scrolling.

---

### `src/components/startup/UserTypeCard.tsx` — Role Selection Card

```tsx
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
```

**What each part does:**
- `interface UserTypeCardProps` — Defines what data this component expects (TypeScript type safety).
  - `title: string` — The role name ("Requester" or "Signer").
  - `description: string` — Short explanation text.
  - `icon: LucideIcon` — A Lucide icon component (not a JSX element — it's a component reference).
  - `onClick: () => void` — A function to call when the card is clicked.
- `icon: Icon` — Renames the `icon` prop to `Icon` (capital I) because React component names must start with uppercase.
- `&rarr;` — HTML entity for the right arrow character (→).
- The card is a `<button>` for accessibility — it's keyboard-navigable and screen-reader-friendly.

---

### `src/components/startup/Startup.tsx` — Main Startup Screen

```tsx
import { toast } from "sonner"
import { FileText, PenLine } from "lucide-react"
import { Navbar } from "./Navbar"
import { UserTypeCard } from "./UserTypeCard"
import "./Startup.css"

function handleUserTypeSelect(userType: "Requester" | "Signer") {
  toast.success(`You selected: ${userType}`, {
    description: `Welcome, ${userType}! Setting up your experience...`,
    duration: 3000,
  })
}

export function Startup() {
  return (
    <div className="startup">
      <Navbar />
      <main className="startup__main">
        <div className="startup__header">
          <h1 className="startup__heading">Welcome to PirmaKo</h1>
          <p className="startup__subtitle">Choose your role to get started</p>
        </div>
        <div className="startup__cards">
          <UserTypeCard
            title="Requester"
            description="Request documents for signature and track their status"
            icon={FileText}
            onClick={() => handleUserTypeSelect("Requester")}
          />
          <UserTypeCard
            title="Signer"
            description="Review and sign documents sent to you for approval"
            icon={PenLine}
            onClick={() => handleUserTypeSelect("Signer")}
          />
        </div>
      </main>
    </div>
  )
}
```

**What each part does:**
- `FileText` and `PenLine` — Lucide icons representing document request and signing actions.
- `handleUserTypeSelect(userType)` — A function (not a hook, not a component) that handles what happens when a card is clicked. It shows a toast notification.
  - `toast.success(...)` — Shows a green success notification.
  - `template literal` — `` `You selected: ${userType}` `` inserts the variable into the string.
  - `duration: 3000` — The notification auto-dismisses after 3 seconds.
- The layout hierarchy:
  - `<div className="startup">` — Full-screen dark background container.
  - `<Navbar />` — Top navigation bar (sticky).
  - `<main className="startup__main">` — Centered content area.
  - `<div className="startup__header">` — Heading + subtitle.
  - `<div className="startup__cards">` — Two cards stacked vertically.

---

### `src/components/startup/Startup.css` — All Styles

**CSS Custom Properties (Variables):**
```css
:root {
  --color-bg-primary: #0f0f1a;
  --color-bg-secondary: #1a1a2e;
  --color-border: #2a2a40;
  --color-text-primary: #e2e8f0;
  --color-accent: #6366f1;
  /* ... */
}
```
- Variables are reusable values defined once and referenced everywhere with `var(--name)`.
- This makes it easy to change the entire color scheme by editing one place.

**Navbar styles:**
- `.navbar` — `display: flex` + `align-items: center` horizontally aligns the icon and title.
- `position: sticky` + `top: 0` — Navbar stays at the top when scrolling.
- `backdrop-filter: blur(12px)` — Frosted glass effect behind the navbar.

**Card styles:**
- `.user-card` — `border-radius: 16px` for large rounded corners.
- `.user-card:hover` — `transform: translateY(-2px)` lifts the card up 2 pixels on hover.
- `.user-card__arrow` — `opacity: 0` hides the arrow by default, `opacity: 1` shows it on hover.
- `transition: all var(--transition-default)` — Smooth 0.25s animation on all property changes.

**Responsive design:**
```css
@media (max-width: 480px) {
  .startup__heading {
    font-size: 28px;  /* Smaller heading on mobile */
  }
}
```
- `@media` queries apply styles only when the screen width matches the condition.

---

### `src/App.tsx` — Root Component

```tsx
import { Startup } from "./components/startup/Startup"
import { SonnerToaster } from "./components/ui/sonner"

function App() {
  return (
    <>
      <Startup />
      <SonnerToaster />
    </>
  )
}

export default App
```

**What it does:**
- `<>...</>` — React Fragment. Wraps multiple elements without adding extra HTML.
- `<Startup />` — The main startup screen.
- `<SonnerToaster />` — The toast notification provider. It renders notifications in a portal (outside the main DOM tree) so they always appear on top.

---

### `src/lib/utils.ts` — Already explained above.

---

## Tech Stack Summary

| Technology | Purpose |
|---|---|
| **React 19** | UI library for building component-based interfaces |
| **TypeScript** | Adds type safety to JavaScript (catches errors at compile time) |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework (write styles as class names) |
| **Sonner** | Toast notification library (clean, modern notifications) |
| **Lucide React** | Icon library (beautiful, consistent SVG icons) |

---

## How to Run

```bash
cd /home/cereal/Documents/Blocklabs\ intern\ application/PirmaKo/client
npm install
npm run dev
```

The app will open at `http://localhost:5173` with the startup screen.

---

## Key Concepts for Beginners

1. **Components** — Each `.tsx` file exports a function that returns JSX (HTML-like syntax). React renders these on screen.

2. **Props** — Data passed to components. Like function arguments. Example: `title="Requester"` passes the string `"Requester"` to the `title` prop.

3. **CSS Classes** — Instead of inline styles, we use class names (`className="navbar"`) and define styles in CSS files. This keeps things organized.

4. **CSS Variables** — `--color-accent: #6366f1` defines a value once; `color: var(--color-accent)` uses it everywhere. Change one variable to update the entire theme.

5. **Events** — `onClick={() => handleUserTypeSelect("Requester")}` calls a function when the button is clicked. The `=>` creates an "arrow function" (a shorthand way to define functions).

6. **TypeScript Interface** — `interface UserTypeCardProps { ... }` defines the shape of data a component expects. TypeScript will warn you if you pass wrong data.

7. **Import/Export** — `import` brings in code from other files. `export` makes code available to other files. This is how JavaScript modules work.
