import { useState } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (body: string) => void | Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function submit() {
    const v = value.trim();
    if (v.length === 0 || disabled) return;
    void onSend(v);
    setValue('');
  }

  return (
    <div
      className="w-full"
      style={{
        padding: '12px 20px 16px',
        borderTop: '1px solid var(--color-current)',
        background: 'rgba(10, 22, 40, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="mx-auto flex items-center gap-2"
        style={{
          maxWidth: 960,
          border: '1px solid var(--color-current)',
          borderRadius: 4,
          padding: '4px 8px 4px 12px',
          background: 'rgba(20, 35, 58, 0.6)',
        }}
      >
        <input
          className="flex-1"
          style={{
            background: 'transparent',
            border: 0,
            outline: 'none',
            color: 'var(--color-ink)',
            fontSize: 15,
            padding: '10px 0',
          }}
          maxLength={600}
          placeholder="type your message…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
        />
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-plankton)' }}>
          {value.length}/600
        </span>
        <button
          onClick={submit}
          disabled={disabled || value.trim().length === 0}
          aria-label="send"
          style={{
            background: 'none',
            border: 0,
            color: value.trim().length ? 'var(--color-kelp)' : 'var(--color-current)',
            cursor: value.trim().length ? 'pointer' : 'default',
            padding: 8,
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
