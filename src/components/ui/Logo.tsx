export function Logo({ size = 96 }: { size?: number }) {
  return (
    <h1
      className="font-serif select-none"
      style={{
        fontSize: size,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: 'var(--color-ink)',
        filter: 'drop-shadow(0 0 40px rgba(228, 236, 244, 0.2))',
        fontWeight: 400,
      }}
    >
      choir.
    </h1>
  );
}
