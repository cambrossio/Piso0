import { useNavigate } from 'react-router-dom';

export default function PagoPendiente() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ minHeight: '100vh', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
      <h2 style={{ color: 'var(--warning)', marginBottom: '16px' }}>Pago Pendiente</h2>
      <p style={{ marginBottom: '24px' }}>El pago está siendo procesado. Te notificaremos cuando se confirme.</p>
      
      <button onClick={() => navigate('/pedido')} className="btn btn-primary" style={{ width: '100%' }}>
        Ver Mi Pedido
      </button>
    </div>
  );
}
