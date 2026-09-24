'use client';
import { useActionState } from 'react';
import { login } from '@/app/admin/actions';
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: '' });
  return (
    <form action={action} className="stack">
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Lozinka
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error && (
        <p className="notice" role="alert">
          {state.error}
        </p>
      )}
      <button className="button dark" disabled={pending}>
        {pending ? 'Prijavljivanje…' : 'Prijavi se'}
      </button>
      <p className="caption muted">Pristup je omogućen samo odobrenim administratorima.</p>
    </form>
  );
}
