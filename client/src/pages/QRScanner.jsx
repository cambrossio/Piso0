import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function QRScanner() {
  const [codigoManual, setCodigoManual] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigoManual.trim()) {
      setError('Ingresa el código de la mesa');
      return;
    }
    navigate(`/mesa/${codigoManual.trim()}`);
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ marginBottom: '8px' }}>Piso0</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Escanea el QR de tu mesa</p>

      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ 
          width: '200px', 
          height: '200px', 
          margin: '0 auto 20px',
          background: 'var(--secondary)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--border)'
        }}>
          <span style={{ fontSize: '48px' }}>📷</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          O ingresa el código manualmente
        </p>

        {error && (
          <div style={{ background: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Código de mesa"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              style={{ textAlign: 'center', fontSize: '18px' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Continuar'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '32px' }}>
        <button onClick={logout} className="btn btn-secondary">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
