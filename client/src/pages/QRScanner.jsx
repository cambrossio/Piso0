import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner() {
  const [codigoManual, setCodigoManual] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.log('Scanner stop error:', err);
      }
      html5QrCodeRef.current = null;
    }
    setShowScanner(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (html5QrCodeRef.current) return;
    
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          stopScanner();
          handleQRScanned(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Error scanner:', err);
      setError('No se pudo acceder a la cámara');
      stopScanner();
    }
  }, [stopScanner]);

  const handleQRScanned = (decodedText) => {
    let mesaCodigo = decodedText;
    
    if (decodedText.includes('/mesa/')) {
      mesaCodigo = decodedText.split('/mesa/')[1].split('?')[0];
    } else if (decodedText.startsWith('http')) {
      try {
        const url = new URL(decodedText);
        mesaCodigo = url.pathname.split('/mesa/')[1] || decodedText;
      } catch (e) {}
    }

    if (mesaCodigo) {
      navigate(`/mesa/${mesaCodigo.trim()}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!codigoManual.trim()) {
      setError('Ingresá el código de la mesa');
      return;
    }
    navigate(`/mesa/${codigoManual.trim()}`);
  };

  const openScanner = () => {
    setShowScanner(true);
    setError('');
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (showScanner) {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showScanner, startScanner]);

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ marginBottom: '8px' }}>Piso0</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Escaneá el QR de tu mesa</p>

      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        {showScanner ? (
          <div ref={scannerRef}>
            <div id="qr-reader"></div>
            <button 
              onClick={stopScanner} 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '12px' }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={openScanner}
              style={{
                width: '200px',
                height: '200px',
                margin: '0 auto 20px',
                background: 'var(--primary)',
                borderRadius: '16px',
                border: '2px solid var(--gold)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '64px' }}>📷</span>
              <span style={{ color: 'var(--gold)', fontSize: '14px', fontWeight: '600' }}>Tocá para escanear</span>
            </button>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              O ingresá el código manualmente
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
          </>
        )}
      </div>

      <div style={{ marginTop: '32px' }}>
        <button onClick={logout} className="btn btn-secondary">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
