const paths = {
  workflow: 'M9 2h6v5H9zM2 17h6v5H2zm14 0h6v5h-6zM12 7v5m-7 5v-5h14v5',
  'arrow-right': 'M4 12h15m-6-6 6 6-6 6',
  edit: 'M14 6l4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20z',
  plus: 'M12 5v14M5 12h14',
  bolt: 'M13 2 4 14h7l-1 8 10-12h-7l1-8z',
  close: 'M6 6l12 12M18 6 6 18',
  table: 'M3 4h18v16H3zm0 6h18m-12 0v10m6-10v10',
};

export default function Icon({ name, size = 16 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
