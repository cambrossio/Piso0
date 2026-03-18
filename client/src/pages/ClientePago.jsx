import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function ClientePago() {
  const { addToast } = useToast();
  const [metodoPago, setMetodoPago] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePagar = async () => {
    const pedidoData = localStorage.getItem('pedidoActual');
    if (!pedidoData) {
      navigate('/scan');
      return;
    }

    const pedido = JSON.parse(pedidoData);

    if (!metodoPago) {
      addToast('Selecciona un método de pago', 'warning');
      return;
    }

    setLoading(true);

    try {
      if (metodoPago === 'mercadopago') {
        const response = await api.post(`/pedidos/crear-preferencia`, { 
          pedidoId: pedido.id 
        });
        
        if (response.data.initPoint) {
          window.location.href = response.data.initPoint;
          return;
        }
      } else if (metodoPago === 'caja') {
        await api.post(`/pedidos/${pedido.id}/pago`, { tipoPago: 'caja' });
        addToast('Pago en caja registrado', 'success');
      }
      
      const updatedPedido = { ...pedido, tipoPago: metodoPago };
      localStorage.setItem('pedidoActual', JSON.stringify(updatedPedido));
      navigate('/pedido');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al procesar pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  const metodos = [
    { id: 'mercadopago', label: 'MercadoPago', icon: '📱', desc: 'Pagar ahora con Checkout MP' },
    { id: 'caja', label: 'Pagar en Caja', icon: '💵', desc: 'Paga cuando llegue el mozo' }
  ];

  return (
    <div className="container" style={{ minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '24px' }}>Método de Pago</h2>

      <div className="grid grid-2" style={{ gap: '12px', marginBottom: '24px' }}>
        {metodos.map(metodo => (
          <div
            key={metodo.id}
            onClick={() => setMetodoPago(metodo.id)}
            className="card"
            style={{
              cursor: 'pointer',
              border: metodoPago === metodo.id ? '2px solid var(--accent)' : '2px solid transparent',
              textAlign: 'center',
              padding: '24px'
            }}
          >
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{metodo.icon}</span>
            <span style={{ fontWeight: '600' }}>{metodo.label}</span>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{metodo.desc}</p>
          </div>
        ))}
      </div>

      <button 
        onClick={handlePagar}
        className="btn btn-primary" 
        style={{ width: '100%' }}
        disabled={!metodoPago || loading}
      >
        {loading ? 'Procesando...' : metodoPago === 'mercadopago' ? 'Pagar con MercadoPago' : 'Confirmar'}
      </button>

      <button 
        onClick={() => navigate('/pedido')}
        className="btn btn-secondary" 
        style={{ width: '100%', marginTop: '12px' }}
      >
        Cancelar
      </button>
    </div>
  );
}
