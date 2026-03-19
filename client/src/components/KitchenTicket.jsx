import { useEffect, useRef } from 'react';

export default function KitchenTicket({ pedido, onClose }) {
  const printRef = useRef();

  useEffect(() => {
    if (printRef.current) {
      printRef.current.focus();
    }
  }, []);

  const handlePrint = () => {
    const printContent = printRef.current;
    const WinPrint = window.open('', '', 'width=300,height=500');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Ticket Cocina</title>
          <style>
            body { font-family: monospace; padding: 10px; margin: 0; }
            h2 { text-align: center; margin-bottom: 10px; }
            .item { margin: 5px 0; padding: 5px; border-bottom: 1px dashed #000; }
            .qty { font-weight: bold; }
            hr { border: 1px dashed #000; }
          </style>
        </head>
        <body>
          <h2>*** COCINA ***</h2>
          <p><strong>Mesa:</strong> ${pedido.numeroMesa || 'Delivery'}</p>
          <p><strong>Pedido:</strong> #${pedido.id.slice(0, 8)}</p>
          <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-AR')}</p>
          <hr>
          ${pedido.items.map((item, i) => `
            <div class="item">
              <span class="qty">${item.cantidad}x</span> ${item.productoNombre}
            </div>
          `).join('')}
          <hr>
          <p style="text-align:center">- - - - -</p>
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 250);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🍳 Ticket para Cocina</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div ref={printRef} tabIndex={0} style={{ outline: 'none' }}>
          <div className="card" style={{ background: '#fff', color: '#000' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>*** COCINA ***</h3>
            <p><strong>Mesa:</strong> {pedido.numeroMesa || 'Delivery'}</p>
            <p><strong>Pedido:</strong> #{pedido.id.slice(0, 8)}</p>
            <p><strong>Hora:</strong> {new Date().toLocaleTimeString('es-AR')}</p>
            <hr style={{ margin: '10px 0' }} />
            {pedido.items.map((item, i) => (
              <p key={i} style={{ margin: '8px 0' }}>
                <strong>{item.cantidad}x</strong> {item.productoNombre}
              </p>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1 }}>
            🖨️ Imprimir Ticket
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
