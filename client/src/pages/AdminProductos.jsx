import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import NotificacionesMozo from '../components/NotificacionesMozo';
import { useToast } from '../components/Toast';

export default function AdminProductos() {
  const { addToast } = useToast();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'otro',
    stock: '',
    stockMinimo: '5'
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await api.get('/productos');
      setProductos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (producto = null) => {
    if (producto) {
      setEditando(producto);
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio,
        categoria: producto.categoria,
        stock: producto.stock,
        stockMinimo: producto.stockMinimo
      });
    } else {
      setEditando(null);
      setForm({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: 'otro',
        stock: '',
        stockMinimo: '5'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/productos/${editando.id}`, form);
        addToast('Producto actualizado correctamente', 'success');
      } else {
        await api.post('/productos', form);
        addToast('Producto creado correctamente', 'success');
      }
      setShowModal(false);
      fetchProductos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar', 'error');
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.delete(`/productos/${id}`);
      addToast('Producto eliminado', 'success');
      fetchProductos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: '32px' }}>
        <div className="flex items-center gap-20">
          <img src="/img/pisocero.png" alt="Piso0" style={{ height: '60px', width: 'auto' }} />
          <h1 style={{ margin: 0 }}>Gestión de Productos</h1>
        </div>
        <div className="flex gap-10">
          <Link to="/admin" className="btn btn-secondary">← Volver</Link>
          <button onClick={() => openModal()} className="btn btn-primary">+ Nuevo Producto</button>
        </div>
      </div>

      <NotificacionesMozo />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(producto => (
              <tr key={producto.id}>
                <td>{producto.nombre}</td>
                <td style={{ textTransform: 'capitalize' }}>{producto.categoria}</td>
                <td>${producto.precio}</td>
                <td>
                  <span style={{ color: producto.stock <= producto.stockMinimo ? 'var(--error)' : 'inherit' }}>
                    {producto.stock}
                  </span>
                </td>
                <td>
                  <span className={`badge ${producto.disponible ? 'badge-listo' : 'badge-cancelado'}`}>
                    {producto.disponible ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-10">
                    <button onClick={() => openModal(producto)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Editar</button>
                    <button onClick={() => eliminarProducto(producto.id)} className="btn btn-danger" style={{ padding: '6px 12px' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--text)', minHeight: '80px' }}
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.precio}
                    onChange={e => setForm({ ...form, precio: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                    <option value="bebida">Bebida</option>
                    <option value="comida">Comida</option>
                    <option value="postre">Postre</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    value={form.stockMinimo}
                    onChange={e => setForm({ ...form, stockMinimo: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                {editando ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
