import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SeleccionarModo() {
  const { usuario } = useAuth();
  const [deliveryInfo, setDeliveryInfo] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) {
      setDeliveryInfo({
        nombre: usuario.nombre || '',
        telefono: usuario.telefono || '',
        direccion: usuario.direccion || ''
      });
    }
  }, [usuario]);

  const handleContinuarLocal = () => {
    localStorage.setItem('modoPedido', 'local');
    navigate('/scan');
  };

  const handleContinuarDelivery = () => {
    if (!deliveryInfo.nombre || !deliveryInfo.telefono || !deliveryInfo.direccion) {
      return;
    }
    localStorage.setItem('modoPedido', 'delivery');
    localStorage.setItem('deliveryInfo', JSON.stringify(deliveryInfo));
    navigate('/menu-delivery');
  };

  const handleBack = () => {
    setShowDeliveryForm(false);
  };

  if (showDeliveryForm) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
          <img src="/img/pisocero.png" alt="Piso0" style={{ width: '100px', height: 'auto', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px' }}>Datos de Delivery</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Editá los datos si querés que lo entreguemos en otro lugar
          </p>

          <div style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                value={deliveryInfo.nombre}
                onChange={(e) => setDeliveryInfo({...deliveryInfo, nombre: e.target.value})}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label>Teléfono *</label>
              <input
                type="tel"
                value={deliveryInfo.telefono}
                onChange={(e) => setDeliveryInfo({...deliveryInfo, telefono: e.target.value})}
                placeholder="+54 11 1234-5678"
                required
              />
            </div>

            <div className="form-group">
              <label>Dirección de entrega *</label>
              <textarea
                value={deliveryInfo.direccion}
                onChange={(e) => setDeliveryInfo({...deliveryInfo, direccion: e.target.value})}
                placeholder="Calle 123, Ciudad, Provincia"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--secondary)',
                  color: 'var(--text)',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button 
              onClick={handleBack}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Volver
            </button>
            <button 
              onClick={handleContinuarDelivery}
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!deliveryInfo.nombre || !deliveryInfo.telefono || !deliveryInfo.direccion}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <img src="/img/pisocero.png" alt="Piso0" style={{ width: '100px', height: 'auto', marginBottom: '16px' }} />
        <h2 style={{ marginBottom: '8px' }}>¿Cómo vas a pedir?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Seleccioná cómo querés hacer tu pedido
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            onClick={handleContinuarLocal}
            className="btn btn-primary"
            style={{ padding: '24px', fontSize: '16px' }}
          >
            🪑 <strong>En el local</strong>
            <p style={{ fontSize: '12px', margin: '8px 0 0 0', fontWeight: 'normal' }}>
              Escaneá el QR de tu mesa
            </p>
          </button>

          <button 
            onClick={() => setShowDeliveryForm(true)}
            className="btn btn-secondary"
            style={{ padding: '24px', fontSize: '16px' }}
          >
            🚀 <strong>Delivery</strong>
            <p style={{ fontSize: '12px', margin: '8px 0 0 0', fontWeight: 'normal' }}>
              Pedí desde tu casa u oficina
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
