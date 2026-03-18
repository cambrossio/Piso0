import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket, joinAdmin } from '../services/socket';

export default function NotificacionesMozo() {
  const [mozosSolicitados, setMozosSolicitados] = useState(() => {
    const saved = localStorage.getItem('mozosSolicitados');
    return saved ? JSON.parse(saved) : [];
  });
  const [cuentasSolicitadas, setCuentasSolicitadas] = useState(() => {
    const saved = localStorage.getItem('cuentasSolicitadas');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('mozosSolicitados', JSON.stringify(mozosSolicitados));
  }, [mozosSolicitados]);

  useEffect(() => {
    localStorage.setItem('cuentasSolicitadas', JSON.stringify(cuentasSolicitadas));
  }, [cuentasSolicitadas]);

  useEffect(() => {
    joinAdmin();
    
    const handleMozoSolicitado = (data) => {
      setMozosSolicitados(prev => {
        const newList = [...prev, { ...data, id: Date.now() }];
        localStorage.setItem('mozosSolicitados', JSON.stringify(newList));
        return newList;
      });
    };

    const handleCuentaSolicitada = (data) => {
      setCuentasSolicitadas(prev => {
        const newList = [...prev, { ...data, id: Date.now() }];
        localStorage.setItem('cuentasSolicitadas', JSON.stringify(newList));
        return newList;
      });
    };

    socket.on('mozo-solicitado', handleMozoSolicitado);
    socket.on('cuenta-solicitada', handleCuentaSolicitada);

    return () => {
      socket.off('mozo-solicitado', handleMozoSolicitado);
      socket.off('cuenta-solicitada', handleCuentaSolicitada);
    };
  }, []);

  const atenderMozo = (id) => {
    setMozosSolicitados(prev => {
      const newList = prev.filter(m => m.id !== id);
      localStorage.setItem('mozosSolicitados', JSON.stringify(newList));
      return newList;
    });
  };

  const atenderCuenta = (id) => {
    setCuentasSolicitadas(prev => {
      const newList = prev.filter(m => m.id !== id);
      localStorage.setItem('cuentasSolicitadas', JSON.stringify(newList));
      return newList;
    });
  };

  return (
    <>
      {cuentasSolicitadas.length > 0 && (
        <div className="grid grid-3" style={{ marginBottom: '24px' }}>
          {cuentasSolicitadas.map((cuenta) => (
            <div key={cuenta.id} className="card" style={{ 
              background: 'var(--warning)', 
              textAlign: 'center'
            }}>
              <h2>🧾 Mesa {cuenta.numeroMesa} pidió la cuenta</h2>
              <div className="flex gap-10" style={{ justifyContent: 'center', marginTop: '12px' }}>
                <button 
                  onClick={() => atenderCuenta(cuenta.id)} 
                  className="btn btn-primary"
                >
                  ✓ Atendido
                </button>
                <button 
                  onClick={() => navigate('/admin/contabilidad')} 
                  className="btn btn-secondary"
                >
                  Ver Caja
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mozosSolicitados.length > 0 && (
        <div className="grid grid-3" style={{ marginBottom: '24px' }}>
          {mozosSolicitados.map((mozo) => (
            <div key={mozo.id} className="card" style={{ 
              background: 'var(--accent)', 
              textAlign: 'center'
            }}>
              <h2>🔔 Mesa {mozo.numeroMesa} solicitó mozo</h2>
              <div className="flex gap-10" style={{ justifyContent: 'center', marginTop: '12px' }}>
                <button 
                  onClick={() => atenderMozo(mozo.id)} 
                  className="btn btn-primary"
                >
                  ✓ Atendido
                </button>
                <button 
                  onClick={() => navigate('/admin/pedidos')} 
                  className="btn btn-secondary"
                >
                  Ver Pedidos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
