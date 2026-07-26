import { useRef, useState, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "../../../lib/constants";

interface SortDropdownProps {

  sort: SortOption;

  onSortChange: (sort: SortOption) => void;
}

export function SortDropdown({ sort, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <div className="signer-sort-dropdown" ref={dropdownRef}>
      <ArrowUpDown size={14} className="signer-sort-dropdown__icon" />

      <button
        className="signer-sort-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedLabel}
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
