
import { useState } from 'react';

export default function CampoPassword({
  id,
  value,
  onChange,
  autoComplete,
  disabled = false
}) {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <div className="campo-password">
      <input
        id={id}
        type={mostrarPassword ? 'text' : 'password'}
        className="form-control"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        disabled={disabled}
      />

      <button
        type="button"
        className="campo-password__botao"
        onClick={() => setMostrarPassword((atual) => !atual)}
        aria-label={
          mostrarPassword
            ? 'Ocultar password'
            : 'Mostrar password'
        }
        aria-pressed={mostrarPassword}
        aria-controls={id}
        disabled={disabled}
      >
        {mostrarPassword ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  );
}
