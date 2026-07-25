/**
 * SortDropdown.tsx — A reusable custom dropdown for selecting sort order.
 *
 * What it does:
 *   - Shows a clickable trigger with the current sort label and a chevron.
 *   - Opens a dropdown menu with all available sort options.
 *   - Clicking outside the dropdown closes it automatically.
 *   - The active sort option is highlighted with the accent color.
 *
 * This is the same pattern used in the Requester homepage, extracted
 * into a reusable component so both screens share the same code.
 */

import { useRef, useState, useEffect } from "react";
import { Filter } from "lucide-react";
import type { SortOption } from "../../../hooks/useSignerPdfs";

/** All available sort options with display labels. */
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Recently Uploaded" },
  { value: "oldest", label: "Oldest" },
  { value: "alpha", label: "Alphabetical by Title" },
];

interface SortDropdownProps {
  /** The currently active sort option. */
  sort: SortOption;
  /** Called when the user picks a new sort option. */
  onSortChange: (sort: SortOption) => void;
}

export function SortDropdown({ sort, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking anywhere outside of it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find the label for the currently selected sort option
  const selectedLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <div className="signer-sort-dropdown" ref={dropdownRef}>
      {/* Funnel icon — indicates this is a filter/sort control */}
      <Filter size={14} className="signer-sort-dropdown__icon" />

      {/* The clickable trigger that opens/closes the menu */}
      <button
        className="signer-sort-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedLabel}
        {/* Chevron arrow that rotates when menu is open */}
        <svg
          className={`signer-sort-dropdown__chevron ${
            isOpen ? "signer-sort-dropdown__chevron--open" : ""
          }`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* The dropdown menu — only visible when isOpen is true */}
      {isOpen && (
        <div className="signer-sort-dropdown__menu" role="listbox">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`signer-sort-dropdown__option ${
                sort === option.value
                  ? "signer-sort-dropdown__option--active"
                  : ""
              }`}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              type="button"
              role="option"
              aria-selected={sort === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
