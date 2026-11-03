import type { TombstoneIconProps } from '@/interfaces/components/TombstoneIconProps'
export function TombstoneIcon({ size = 14 }: TombstoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="tombstone"
    >
      <path d="M6 21V10a6 6 0 0 1 12 0v11" />
      <path d="M3 21h18" />
      <path d="M12 8v6M9.5 10.5h5" />
    </svg>
  )
}
