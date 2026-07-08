export const EVENT_TYPE_COLORS = [
  { label: 'Teal', value: '#5B8A8A' },
  { label: 'Blue', value: '#5B7A99' },
  { label: 'Rose', value: '#B87A8C' },
  { label: 'Amber', value: '#B8935B' },
  { label: 'Sage', value: '#7A9470' },
  { label: 'Plum', value: '#8A6E99' },
  { label: 'Clay', value: '#B8785B' },
  { label: 'Stone', value: '#7A7A72' },
] as const

export const EVENT_TYPE_COLOR_VALUES = EVENT_TYPE_COLORS.map((c) => c.value) as [string, ...string[]]
