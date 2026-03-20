import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import NotificacionesMozo from '../components/NotificacionesMozo';

export default function AdminAdministracion() {
  const { addToast } = useToast();
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  const crearBackup = async () => {
    try {
      const res = await api.get('/backup');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `piso0-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Backup descargado correctamente', 'success');
    } catch (err) {
      addToast('Error al crear backup', 'error');
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);
      if (!data.data || !data.data.pedidos || !data.data.productos) {
        addToast('Archivo de backup inválido', 'error');
        return;
      }
      if (!window.confirm('¿Estás seguro? Esto reemplazará todos los datos actuales.')) return;
      await api.post('/backup/restore', data);
      addToast('Backup restaurado correctamente. Recargando...', 'success');
      setShowRestoreModal(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      addToast('Error al restaurar backup', 'error');
    }
  };

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="flex items-center gap-20">
          <img src="/img/pisocero.png" alt="Piso0" style={{ height: '60px', width: 'auto' }} />
          <h1 style={{ margin: 10 }}>Administración</h1>
        </div>
        <Link to="/admin" className="btn btn-secondary">← Volver</Link>
      </div>

      <NotificacionesMozo />

      <div className="grid grid-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px' }}>💾 Crear Backup</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Descarga una copia de seguridad de todos los datos del sistema.
          </p>
          <button onClick={crearBackup} className="btn btn-primary" style={{ width: '100%' }}>
            Descargar Backup
          </button>
        </div>

        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px' }}>📂 Restaurar Backup</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Restaura datos desde un archivo de backup anterior.
          </p>
          <button onClick={() => setShowRestoreModal(true)} className="btn btn-warning" style={{ width: '100%' }}>
            Restaurar Datos
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '32px', maxWidth: '800px', margin: '32px auto' }}>
        <h3 style={{ marginBottom: '16px' }}>⚠️ Importante</h3>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <li>Realizá backups periódicos para proteger tus datos.</li>
          <li>Guardá los archivos de backup en un lugar seguro.</li>
          <li>Restaurar un backup reemplazará TODOS los datos actuales.</li>
        </ul>
      </div>

      {showRestoreModal && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📂 Restaurar Backup</h2>
              <button onClick={() => setShowRestoreModal(false)} className="modal-close">×</button>
            </div>

            <p style={{ marginBottom: '20px', color: 'var(--warning)' }}>
              ⚠️ ADVERTENCIA: Restaurar un backup reemplazará TODOS los datos actuales.
            </p>

            <div className="form-group">
              <label>Seleccionar archivo de backup (.json)</label>
              <input
                type="file"
                accept=".json"
                onChange={e => setRestoreFile(e.target.files[0])}
              />
            </div>

            <button 
              onClick={handleRestore} 
              className="btn btn-warning" 
              style={{ width: '100%', marginTop: '16px' }}
              disabled={!restoreFile}
            >
              Restaurar Datos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
