export type SortOption = "newest" | "oldest" | "alpha";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Recently Uploaded" },
  { value: "oldest", label: "Oldest" },
  { value: "alpha", label: "Alphabetical by Title" },
];
