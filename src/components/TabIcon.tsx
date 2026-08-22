type TabIconName = 'home' | 'timeline' | 'photos' | 'letter'

type Props = {
  name: TabIconName
  active?: boolean
}

export function TabIcon({ name, active }: Props) {
  const stroke = active ? 'var(--accent)' : 'var(--ink-dim)'
  const props = {
    viewBox: '0 0 24 24',
    width: 22,
    height: 22,
    fill: 'none',
    stroke,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M4.5 10.5 12 4.5l7.5 6" />
          <path d="M6 9.75V19a1 1 0 0 0 1 1h3.5v-4.5h3V20H17a1 1 0 0 0 1-1V9.75" />
        </svg>
      )
    case 'timeline':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 7.5v4.5l3 1.5" />
        </svg>
      )
    case 'photos':
      return (
        <svg {...props}>
          <rect x="4.5" y="6" width="15" height="12" rx="2" />
          <circle cx="9" cy="10" r="1.35" fill={stroke} stroke="none" />
          <path d="m5.5 16.5 4-3.5 2.5 2 3-2.5 3.5 4" />
        </svg>
      )
    case 'letter':
      return (
        <svg {...props}>
          <path d="M5.5 6.5h13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
          <path d="m6 8.5 6 4 6-4" />
        </svg>
      )
  }
}
