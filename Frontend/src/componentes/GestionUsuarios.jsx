import React, { useState } from 'react';
import { FiUserPlus, FiShield, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const GestionUsuarios = () => {
    const [form, setForm] = useState({
        nombre: '',
        correo: '',
        password: '',
        rol: 'PSICOLOGO'
    });
    const [creadosSesion, setCreadosSesion] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const { data } = await api.post('/auth/registro', form);
            setCreadosSesion(prev => [data, ...prev]);
            setMensaje({
                tipo: 'ok',
                texto: `Cuenta creada para ${data.nombre} (${data.rol}). Ya puede iniciar sesión.`
            });
            setForm({ nombre: '', correo: '', password: '', rol: 'PSICOLOGO' });
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo registrar el usuario. Verifica si el correo ya existe.'
            });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <main className="overview-container">
            <div className="overview-welcome">
                <div>
                    <h1>Gestión de Equipo</h1>
                    <p>Crea cuentas internas para psicólogos, analistas y administradores del portal.</p>
                </div>
            </div>

            {mensaje.texto && (
                <div className={mensaje.tipo === 'error' ? 'create-error-banner' : 'module-success-banner'}>
                    {mensaje.tipo === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
                    <span>{mensaje.texto}</span>
                </div>
            )}

            <div className="usuarios-layout-grid">
                <section className="recent-candidates-card">
                    <div className="recent-header">
                        <h3><FiUserPlus /> Registrar Nuevo Integrante</h3>
                        <p>Las contraseñas se almacenan encriptadas con BCrypt en la base de datos.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="create-modal-form">
                        <div className="create-field">
                            <label>Nombre Completo <span>*</span></label>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                placeholder="Ej: María Victoria Bustamante"
                                required
                            />
                        </div>

                        <div className="create-field">
                            <label>Correo Institucional <span>*</span></label>
                            <input
                                type="email"
                                value={form.correo}
                                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                                placeholder="psicologa@aquachile.cl"
                                required
                            />
                        </div>

                        <div className="create-form-grid-2">
                            <div className="create-field">
                                <label>Contraseña Temporal <span>*</span></label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>
                            <div className="create-field">
                                <label>Rol en el Sistema <span>*</span></label>
                                <select
                                    value={form.rol}
                                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                                >
                                    <option value="PSICOLOGO">PSICOLOGO</option>
                                    <option value="ANALISTA">ANALISTA</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </div>

                        <div className="create-modal-footer">
                            <button type="submit" className="btn-guardar-modern" disabled={guardando}>
                                {guardando ? 'Registrando...' : 'Crear Usuario'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="recent-candidates-card">
                    <div className="recent-header">
                        <h3><FiShield /> Permisos por Rol</h3>
                        <p>Resumen de accesos configurados en Spring Security.</p>
                    </div>
                    <ul className="roles-info-list">
                        <li><strong>ADMIN:</strong> Control total (Kanban, Métricas, Ofertas, Candidatos, Usuarios y eliminación de solicitudes).</li>
                        <li><strong>PSICOLOGO:</strong> Gestión del tablero Kanban, métricas, evaluaciones psicolaborales y directorio de candidatos.</li>
                        <li><strong>ANALISTA:</strong> Creación de solicitudes, registro de evaluaciones y consulta/edición de candidatos.</li>
                    </ul>

                    {creadosSesion.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Creados en esta sesión</h4>
                            <ul className="roles-info-list">
                                {creadosSesion.map((u, idx) => (
                                    <li key={u.id || idx}>
                                        <strong>{u.nombre}</strong> — {u.correo} ({u.rol})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

export default GestionUsuarios;