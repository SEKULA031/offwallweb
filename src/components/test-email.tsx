'use client';
import { useActionState } from 'react';
import { testEmail } from '@/app/admin/actions';

export function TestEmail() {
  const [state, action, pending] = useActionState(testEmail, { message: '' });
  return (
    <form action={action} className="stack small-gap">
      <h2 className="small-heading">Provera emailova</h2>
      <p>
        Pošalji probnu poruku na adresu za obaveštenja podešenu u Vercelu. Ova provera ne otvara
        prodavnicu i ne pravi porudžbinu.
      </p>
      <button className="button dark" disabled={pending}>
        {pending ? 'Slanje je u toku…' : 'Pošalji probni email'}
      </button>
      <p role="status">{state.message}</p>
    </form>
  );
}
