import { useNavigate } from 'react-router-dom';

export default function DeliveryExitoso() {
  const navigate = useNavigate();

  const handleVolver = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="container" style={{ minHeight: '100vh', textAlign: 'center', paddingTop: '60px' }}>
      <img src="/img/pisocero.png" alt="Piso0" style={{ width: '120px', marginBottom: '24px' }} />
      
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ color: 'var(--success)', marginBottom: '16px' }}>¡Pedido Confirmado!</h2>
      
      <div className="card" style={{ textAlign: 'left', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '12px' }}>📋 Tu pedido está en proceso</h4>
        <p style={{ marginBottom: '8px' }}>
          Estamos preparando tu pedido y lo enviaremos a la brevedad.
        </p>
        <p style={{ color: 'var(--gold)' }}>
          Recibirás una notificación cuando esté en camino.
        </p>
      </div>

      <div className="card" style={{ textAlign: 'left', background: 'var(--secondary)' }}>
        <h4 style={{ marginBottom: '8px' }}>📱 Próximos pasos:</h4>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li>Preparamos tu pedido</li>
          <li>Un cadete lo retira del local</li>
          <li>Te contactamos si hay alguna demora</li>
          <li>¡Disfrutá tu comida!</li>
        </ul>
      </div>

      <button 
        onClick={handleVolver}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '32px', padding: '16px' }}
      >
        Volver al Inicio
      </button>
    </div>
  );
}
