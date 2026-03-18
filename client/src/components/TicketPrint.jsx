import { useRef } from 'react';

export default function TicketPrint({ pedido, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Piso0</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; background: #fff; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #D4A843; }
            .logo { width: 100px; height: auto; margin-bottom: 8px; }
            .title { color: #D4A843; font-weight: bold; font-size: 20px; margin: 5px 0; }
            .subtitle { color: #333; font-size: 12px; }
            .divider { border-top: 1px dashed #999; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
            .row-items { flex-direction: column; }
            .item { display: flex; justify-content: space-between; margin: 4px 0; }
            .item-name { flex: 1; }
            .item-price { width: 80px; text-align: right; }
            .total { font-weight: bold; font-size: 18px; margin-top: 10px; border-top: 2px solid #D4A843; padding-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
            .gold { color: #D4A843; }
            .center { text-align: center; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!pedido) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#fff', color: '#000', borderRadius: '12px', padding: '24px', maxWidth: '350px', width: '90%'
      }} onClick={e => e.stopPropagation()}>
        <div ref={printRef} style={{ fontFamily: "'Courier New', monospace", fontSize: '14px' }}>
          <div className="header">
            <img src="/img/pisocero.png" alt="Piso0" className="logo" />
            <p className="title">PISO CERO</p>
            <p className="subtitle">Resto Bar</p>
          </div>
          
          <div className="divider"></div>
          
          <div className="row">
            <span>Ticket:</span>
            <span>#{pedido.id?.slice(0, 8) || pedido.id}</span>
          </div>
          <div className="row">
            <span>Mesa:</span>
            <span>{pedido.numeroMesa || 'N/A'}</span>
          </div>
          <div className="row">
            <span>Fecha:</span>
            <span>{new Date(pedido.createdAt || Date.now()).toLocaleString('es-AR')}</span>
          </div>
          <div className="row gold">
            <span>Estado:</span>
            <span>PAGADO</span>
          </div>
          
          <div className="divider"></div>
          
          <div className="row-items">
            {pedido.items?.map((item, idx) => (
              <div key={idx} className="item">
                <span className="item-name">{item.cantidad}x {item.productoNombre}</span>
                <span className="item-price">${(item.precioUnitario * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="divider"></div>
          
          <div className="row total">
            <span>TOTAL:</span>
            <span>${parseFloat(pedido.total).toFixed(2)}</span>
          </div>
          
          <div className="row" style={{ marginTop: '10px' }}>
            <span>Pago:</span>
            <span>{pedido.tipoPago === 'mercadopago' ? 'MercadoPago' : pedido.tipoPago === 'caja' ? 'Pago en Caja' : pedido.tipoPago}</span>
          </div>
          
          <div className="footer">
            <div className="divider"></div>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>¡Gracias por su visita!</p>
            <p>PISO CERO - Resto Bar</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, background: '#D4A843', borderColor: '#D4A843' }}>
            🖨️ Imprimir
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
