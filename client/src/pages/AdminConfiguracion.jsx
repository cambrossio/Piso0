import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import NotificacionesMozo from '../components/NotificacionesMozo';

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

export default function AdminConfiguracion() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryDays, setDeliveryDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [startHour, setStartHour] = useState(20);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(59);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/config');
      if (res.data.deliverySchedule) {
        const schedule = res.data.deliverySchedule;
        setDeliveryEnabled(schedule.enabled ?? true);
        setDeliveryDays(schedule.days ?? [0, 1, 2, 3, 4, 5, 6]);
        setStartHour(schedule.startHour ?? 20);
        setStartMinute(schedule.startMinute ?? 0);
        setEndHour(schedule.endHour ?? 23);
        setEndMinute(schedule.endMinute ?? 59);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.post('/config', {
        key: 'deliverySchedule',
        value: {
          enabled: deliveryEnabled,
          days: deliveryDays,
          startHour,
          startMinute,
          endHour,
          endMinute
        }
      });
      addToast('Configuración guardada', 'success');
    } catch (err) {
      addToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    if (deliveryDays.includes(day)) {
      setDeliveryDays(deliveryDays.filter(d => d !== day));
    } else {
      setDeliveryDays([...deliveryDays, day].sort());
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="flex items-center gap-20">
          <img src="/img/pisocero.png" alt="Piso0" style={{ height: '60px', width: 'auto' }} />
          <h1 style={{ margin: 10 }}>Configuración</h1>
        </div>
        <Link to="/admin" className="btn btn-secondary">← Volver</Link>
      </div>

      <NotificacionesMozo />

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>🚗 Configuración de Delivery</h3>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={deliveryEnabled}
              onChange={(e) => setDeliveryEnabled(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Habilitar Delivery
            </span>
          </label>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', marginLeft: '32px' }}>
            Si está deshabilitado, los clientes no podrán hacer pedidos delivery
          </p>
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block' }}>
            Días disponibles:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {diasSemana.map(dia => (
              <button
                key={dia.value}
                onClick={() => toggleDay(dia.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: deliveryDays.includes(dia.value) ? '2px solid var(--gold)' : '2px solid var(--border)',
                  background: deliveryDays.includes(dia.value) ? 'var(--gold)' : 'transparent',
                  color: deliveryDays.includes(dia.value) ? '#000' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: deliveryDays.includes(dia.value) ? '600' : '400'
                }}
              >
                {dia.label.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block' }}>
            Horario de atención:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Desde:</span>
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span>:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(parseInt(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                {[0, 15, 30, 45].map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>

            <span>hasta</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span>:</span>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(parseInt(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                {[0, 15, 30, 45].map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '20px', background: 'var(--secondary)', padding: '16px' }}>
          <h4 style={{ marginBottom: '12px' }}>📋 Resumen:</h4>
          {deliveryEnabled ? (
            <p style={{ margin: 0 }}>
              Delivery disponible los {diasSemana.filter(d => deliveryDays.includes(d.value)).map(d => d.label).join(', ')} 
              {' '}de {formatTime(startHour, startMinute)} a {formatTime(endHour, endMinute)}
            </p>
          ) : (
            <p style={{ margin: 0, color: 'var(--error)' }}>
              Delivery deshabilitado
            </p>
          )}
        </div>

        <button
          onClick={saveConfig}
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '24px', padding: '12px' }}
        >
          {saving ? 'Guardando...' : '💾 Guardar Configuración'}
        </button>
      </div>

      <div className="card" style={{ background: 'var(--secondary)' }}>
        <h4 style={{ marginBottom: '12px' }}>💡 Nota:</h4>
        <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
          <li>Los cambios se aplican inmediatamente.</li>
          <li>Si el delivery está deshabilitado, los clientes verán un mensaje al intentar pedir.</li>
          <li>Los pedidos en curso no se ven afectados.</li>
        </ul>
      </div>
    </div>
  );
}
