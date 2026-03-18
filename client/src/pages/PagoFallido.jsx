import { useNavigate } from 'react-router-dom';

export default function PagoFallido() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ minHeight: '100vh', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
      <h2 style={{ color: 'var(--error)', marginBottom: '16px' }}>Pago Fallido</h2>
      <p style={{ marginBottom: '24px' }}>El pago no pudo ser procesado. Por favor intentá nuevamente.</p>
      
      <button onClick={() => navigate('/pago')} className="btn btn-primary" style={{ width: '100%', marginBottom: '12px' }}>
        Intentar Nuevamente
      </button>
      
      <button onClick={() => navigate('/pedido')} className="btn btn-secondary" style={{ width: '100%' }}>
        Volver al Pedido
      </button>
    </div>
  );
}
