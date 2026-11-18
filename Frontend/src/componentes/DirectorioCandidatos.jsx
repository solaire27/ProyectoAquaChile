import React, { useEffect, useState } from 'react';
import {
    FiSearch, FiEdit2, FiX, FiUser, FiAlertCircle, FiCheckCircle, FiFileText
} from 'react-icons/fi';
import api from '../services/api';

const FAMILIAS = ['Operativo', 'Administrativo', 'Jefatura', 'Gerencia', 'TI'];

const DirectorioCandidatos = ({ obtenerIniciales }) => {
    const [candidatos, setCandidatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [editando, setEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const cargarCandidatos = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/candidatos');
            setCandidatos(Array.isArray(data) ? data : []);
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo cargar el directorio de candidatos.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCandidatos();
    }, []);

    const abrirEdicion = (cand) => {
        setMensaje({ tipo: '', texto: '' });
        setEditando({
            id: cand.id,
            nombre: cand.nombre || '',
            rut: cand.rut || '',
            correo: cand.correo || '',
            telefono: cand.telefono || '',
            fechaNacimiento: cand.fechaNacimiento || '',
            familiaCargo: cand.familiaCargo || 'Operativo',
            cargoPostulacion: cand.cargoPostulacion || '',
            urlCv: cand.urlCv || ''
        });
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            await api.put(`/candidatos/${editando.id}`, {
                nombre: editando.nombre,
                rut: editando.rut,
                correo: editando.correo,
                telefono: editando.telefono,
                fechaNacimiento: editando.fechaNacimiento,
                familiaCargo: editando.familiaCargo,
                cargoPostulacion: editando.cargoPostulacion,
                urlCv: editando.urlCv
            });
            setEditando(null);
            setMensaje({ tipo: 'ok', texto: 'Datos del candidato actualizados.' });
            await cargarCandidatos();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudieron actualizar los datos.'
            });
        } finally {
            setGuardando(false);
        }
    };

    const filtrados = candidatos.filter(c => {
        const q = busqueda.toLowerCase();
        return (
            (c.nombre || '').toLowerCase().includes(q) ||
            (c.rut || '').toLowerCase().includes(q) ||
            (c.correo || '').toLowerCase().includes(q) ||
            (c.cargoPostulacion || '').toLowerCase().includes(q)
        );
    });

    return (
        <main className="overview-container">
            <div className="overview-welcome">
                <div>
                    <h1>Directorio de Candidatos</h1>
                    <p>Base histórica de postulantes registrados con acceso rápido a sus datos de contacto y edición.</p>
                </div>
                <div className="kanban-search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUT, correo o cargo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {mensaje.texto && (
                <div className={mensaje.tipo === 'error' ? 'create-error-banner' : 'module-success-banner'}>
                    {mensaje.tipo === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
                    <span>{mensaje.texto}</span>
                </div>
            )}

            <section className="recent-candidates-card">
                <div className="recent-header">
                    <h3>Postulantes Registrados ({filtrados.length})</h3>
                </div>

                {loading ? (
                    <p className="module-empty-msg">Cargando directorio...</p>
                ) : filtrados.length === 0 ? (
                    <p className="module-empty-msg">No se encontraron candidatos con ese criterio.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="ats-table">
                            <thead>
                                <tr>
                                    <th>Candidato / RUT</th>
                                    <th>Contacto</th>
                                    <th>Fecha Nac.</th>
                                    <th>Cargo / Área</th>
                                    <th>CV</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map(cand => (
                                    <tr key={cand.id}>
                                        <td>
                                            <div className="table-candidate-cell">
                                                <div className="mini-avatar">{obtenerIniciales(cand.nombre)}</div>
                                                <div>
                                                    <div className="candidate-strong">{cand.nombre}</div>
                                                    <div className="candidate-sub">{cand.rut || 'Sin RUT'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>{cand.correo}</div>
                                            <div className="candidate-sub">{cand.telefono || 'Sin teléfono'}</div>
                                        </td>
                                        <td>{cand.fechaNacimiento || '—'}</td>
                                        <td>
                                            <div className="candidate-strong">{cand.cargoPostulacion}</div>
                                            <div className="candidate-sub">{cand.familiaCargo}</div>
                                        </td>
                                        <td>
                                            {cand.urlCv ? (
                                                <span className="trello-badge ia-badge" title={cand.urlCv}>
                                                    <FiFileText /> Adjunto
                                                </span>
                                            ) : (
                                                <span className="no-ia-text">Sin CV</span>
                                            )}
                                        </td>
                                        <td>
                                            <button className="btn-table-view" onClick={() => abrirEdicion(cand)}>
                                                <FiEdit2 /> Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {editando && (
                <div className="modal-overlay" onClick={() => setEditando(null)}>
                    <div className="modern-create-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="create-modal-header">
                            <div className="create-header-title">
                                <div className="create-icon-badge"><FiUser /></div>
                                <div>
                                    <h3>Editar Candidato #{editando.id}</h3>
                                    <p>Actualiza los datos personales o el cargo asociado.</p>
                                </div>
                            </div>
                            <button className="trello-modal-close" onClick={() => setEditando(null)}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={guardarEdicion} className="create-modal-form">
                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>RUT <span>*</span></label>
                                    <input
                                        type="text"
                                        value={editando.rut}
                                        onChange={(e) => setEditando({ ...editando, rut: e.target.value })}
                                        maxLength={12}
                                        required
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Nombre Completo <span>*</span></label>
                                    <input
                                        type="text"
                                        value={editando.nombre}
                                        onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Correo Electrónico <span>*</span></label>
                                    <input
                                        type="email"
                                        value={editando.correo}
                                        onChange={(e) => setEditando({ ...editando, correo: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Teléfono</label>
                                    <input
                                        type="text"
                                        value={editando.telefono}
                                        onChange={(e) => setEditando({ ...editando, telefono: e.target.value })}
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Fecha de Nacimiento <span>*</span></label>
                                    <input
                                        type="date"
                                        value={editando.fechaNacimiento}
                                        onChange={(e) => setEditando({ ...editando, fechaNacimiento: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Familia de Cargo <span>*</span></label>
                                    <select
                                        value={editando.familiaCargo}
                                        onChange={(e) => setEditando({ ...editando, familiaCargo: e.target.value })}
                                    >
                                        {FAMILIAS.map(fam => (
                                            <option key={fam} value={fam}>{fam}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="create-field">
                                <label>Cargo de Postulación <span>*</span></label>
                                <input
                                    type="text"
                                    value={editando.cargoPostulacion}
                                    onChange={(e) => setEditando({ ...editando, cargoPostulacion: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="create-modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setEditando(null)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar-modern" disabled={guardando}>
                                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default DirectorioCandidatos;