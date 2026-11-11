import { useEffect, useId, useRef } from 'react';

export default function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  variante = 'success',
  onConfirmar,
  onCancelar,
  cancelarVermelho = true,
}) {
  const dialogRef = useRef(null);
  const tituloId = useId();
  const mensagemId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (aberto && !dialog.open) {
      dialog.showModal();
    } else if (!aberto && dialog.open) {
      dialog.close();
    }
  }, [aberto]);

  function cancelar(e) {
    e.preventDefault();
    onCancelar();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-confirmacao"
      aria-labelledby={tituloId}
      aria-describedby={mensagemId}
      onCancel={cancelar}
    >
      <h2 id={tituloId} className="modal-confirmacao__titulo">
        {titulo}
      </h2>

      <p id={mensagemId} className="modal-confirmacao__mensagem">
        {mensagem}
      </p>

      <div className="modal-confirmacao__acoes">
        <button
          type="button"
          className={`btn btn-outline-secondary${
            cancelarVermelho ? ' modal-confirmacao__cancelar-vermelho' : ''
          }`}
          onClick={onCancelar}
        >
          Cancelar
        </button>

        <button
          type="button"
          className={`btn btn-${variante}`}
          onClick={onConfirmar}
        >
          {textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}