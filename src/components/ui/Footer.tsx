export function Footer() {
  return (
    <div
      className="font-mono text-center pointer-events-none"
      style={{
        fontSize: 11,
        color: 'var(--color-plankton)',
        letterSpacing: '0.04em',
        lineHeight: 1.6,
        maxWidth: 460,
        margin: '48px auto 28px',
      }}
    >
      choir is a mirror, not a judge. everyone in the
      <br />
      room sees everything. nothing is stored beyond
      <br />
      14 days. no individual is scored.
    </div>
  );
}
