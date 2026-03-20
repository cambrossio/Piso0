import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function MenuDelivery() {
  const [productos, setProductos] = useState([]);
  const [categorias] = useState(['bebida', 'comida', 'postre', 'otro']);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('bebida');
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const { addToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');

  useEffect(() => {
    if (localStorage.getItem('modoPedido') !== 'delivery') {
      navigate('/seleccionar-modo');
      return;
    }
    checkDeliveryAvailability();
    fetchProductos();
  }, []);

  const checkDeliveryAvailability = async () => {
    try {
      const res = await api.get('/config/delivery-check');
      setDeliveryAvailable(res.data.available);
      setDeliveryStatus(res.data);
    } catch (err) {
      console.error(err);
      setDeliveryAvailable(true);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await api.get('/productos');
      setProductos(res.data.filter(p => p.disponible));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find(item => item.productoId === producto.id);
    if (existente) {
      setCarrito(carrito.map(item => 
        item.productoId === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        productoId: producto.id,
        productoNombre: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: 1
      }]);
    }
  };

  const actualizarCantidad = (productoId, delta) => {
    setCarrito(carrito.map(item => {
      if (item.productoId === productoId) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad <= 0) return null;
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }).filter(Boolean));
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.productoId !== productoId));
  };

  const total = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);

  const confirmarPedido = () => {
    if (carrito.length === 0) {
      addToast('Agregá productos al carrito', 'warning');
      return;
    }
    localStorage.setItem('carritoDelivery', JSON.stringify(carrito));
    navigate('/delivery-pago');
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  const productosFiltrados = productos.filter(p => p.categoria === categoriaSeleccionada);

  return (     
    <div className="container" style={{ paddingBottom: '120px' }}>
      <div className="flex flex-between" style={{ marginBottom: '20px' }}>
        <h2>🍽️ Delivery</h2>
        <button onClick={() => setMostrarCarrito(true)} className="btn btn-primary">
          🛒 Carrito ({carrito.reduce((sum, item) => sum + item.cantidad, 0)})
        </button>
        <button onClick={() => {
            logout();
            navigate('/login');
         }} className="btn btn-danger">Cerrar Sesión</button>
      </div>

      <div style={{ background: 'var(--secondary)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px' }}>
          📍 <strong>Entrega en:</strong> {deliveryInfo.direccion}
        </p>
        <p style={{ fontSize: '13px' }}>
          📞 {deliveryInfo.telefono}
        </p>
        {deliveryStatus && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            🕐 Horario: {deliveryStatus.schedule?.startHour}:{String(deliveryStatus.schedule?.startMinute || 0).padStart(2, '0')} - {deliveryStatus.schedule?.endHour}:{String(deliveryStatus.schedule?.endMinute || 0).padStart(2, '0')}
          </p>
        )}
      </div>

      {!deliveryAvailable && (
        <div style={{ 
          background: 'var(--error)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>⚠️ Delivery no disponible</h3>
          <p style={{ margin: 0 }}>
            {deliveryStatus?.reason || 'No se puede pedir delivery en este momento'}
          </p>
          {deliveryStatus?.currentTime && (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Hora actual: {deliveryStatus.currentTime}
            </p>
          )}
        </div>
      )}
   

      <div className="flex gap-10" style={{ marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaSeleccionada(cat)}
            className={`btn ${categoriaSeleccionada === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-2">
        {productosFiltrados.map(producto => (
          <div key={producto.id} className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '4px' }}>{producto.nombre}</h4>
                {producto.descripcion && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {producto.descripcion}
                  </p>
                )}
                <p style={{ color: 'var(--gold)', fontWeight: 'bold' }}>${producto.precio}</p>
              </div>
              <button 
                onClick={() => agregarAlCarrito(producto)}
                className="btn btn-primary"
                style={{ padding: '8px 16px' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          No hay productos en esta categoría
        </p>
      )}

      {carrito.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--primary)',
          borderTop: '2px solid var(--gold)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total</span>
            <h3 style={{ margin: 0, color: 'var(--gold)' }}>${total}</h3>
          </div>
          <button onClick={confirmarPedido} className="btn btn-primary" style={{ padding: '12px 24px' }} disabled={!deliveryAvailable}>
            Confirmar Pedido
          </button>
        </div>
      )}
      
      {mostrarCarrito && (
        <div className="modal-overlay" onClick={() => setMostrarCarrito(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>🛒 Tu Carrito</h2>
              <button onClick={() => setMostrarCarrito(false)} className="modal-close">×</button>
            </div>

            {carrito.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Tu carrito está vacío
              </p>
            ) : (
              <>
                {carrito.map(item => (
                  <div key={item.productoId} className="card" style={{ marginBottom: '12px', padding: '12px' }}>
                    <div className="flex flex-between">
                      <div>
                        <strong>{item.productoNombre}</strong>
                        <p style={{ color: 'var(--gold)', margin: '4px 0 0 0' }}>${item.precioUnitario}</p>
                      </div>
                      <div className="flex items-center gap-10">
                        <button 
                          onClick={() => actualizarCantidad(item.productoId, -1)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                          {item.cantidad}
                        </span>
                        <button 
                          onClick={() => actualizarCantidad(item.productoId, 1)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px' }}
                        >
                          +
                        </button>
                        <button 
                          onClick={() => quitarDelCarrito(item.productoId)}
                          className="btn btn-danger"
                          style={{ padding: '4px 12px' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
        

                <div style={{ borderTop: '2px solid var(--gold)', paddingTop: '16px', marginTop: '16px' }}>
                  <div className="flex flex-between">
                    <strong>Total:</strong>
                    <strong style={{ fontSize: '18px', color: 'var(--gold)' }}>${total}</strong>
                  </div>
                </div>

                <button 
                  onClick={confirmarPedido}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  Confirmar Pedido
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
