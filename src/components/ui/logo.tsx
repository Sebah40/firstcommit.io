export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="6" cy="18" r="4" />
      <rect x="9" y="8" width="18" height="5" rx="2.5" transform="rotate(-45 9 8)" />
      <rect x="14" y="13" width="12" height="5" rx="2.5" transform="rotate(-45 14 13)" opacity="0.4" />
    </svg>
  );
}
