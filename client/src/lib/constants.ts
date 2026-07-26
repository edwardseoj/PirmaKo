/**
 * constants.ts — Shared constants used across the application.
 *
 * Avoids duplication of sort options and other configuration
 * that was previously copy-pasted between Homepage and SignerHomepage.
 */

/** Available sort options for PDF lists. */
export type SortOption = "newest" | "oldest" | "alpha";

/** All available sort options with display labels. */
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Recently Uploaded" },
  { value: "oldest", label: "Oldest" },
  { value: "alpha", label: "Alphabetical by Title" },
];
