import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './PostulacionPublica.css';

// Diccionario de cargos según la familia
const opcionesCargos = {
    Operativo: ['Operario de Planta', 'Asistente de Producción', 'Técnico de Mantenimiento', 'Operario de Grúa'],
    Administrativo: ['Asistente Administrativo', 'Analista Contable', 'Recepcionista', 'Ejecutivo de RRHH'],
    Jefatura: ['Jefe de Turno', 'Jefe de Planta', 'Supervisor de Área', 'Jefe de Logística'],
    Gerencia: ['Gerente de Operaciones', 'Gerente Comercial', 'Gerente de Finanzas']
};

const PostulacionPublica = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        telefono: '',
        familiaCargo: 'Operativo',
        cargoPostulacion: opcionesCargos['Operativo'][0]
    });
    
    const [cvFile, setCvFile] = useState(null);
    const [estado, setEstado] = useState({ loading: false, mensaje: '', error: false });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'familiaCargo') {
            setFormData({
                ...formData,
                familiaCargo: value,
                cargoPostulacion: opcionesCargos[value][0]
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        setCvFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEstado({ loading: true, mensaje: '', error: false });

        try {
            const data = new FormData();
            data.append("candidato", new Blob([JSON.stringify(formData)], { type: "application/json" }));
            if (cvFile) data.append("cv", cvFile);

            await api.post('/postulaciones/public', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setEstado({ loading: false, mensaje: '¡Postulación enviada con éxito! Te contactaremos pronto.', error: false });
            setFormData({ 
                nombre: '', correo: '', telefono: '', 
                familiaCargo: 'Operativo', cargoPostulacion: opcionesCargos['Operativo'][0]
            });
            setCvFile(null);
            e.target.reset();
        } catch (error) {
            setEstado({ loading: false, mensaje: 'Hubo un error al enviar la postulación.', error: true });
        }
    };

    return (
        <div className="form-page-container">
            <header className="form-header">
                <Link to="/" className="form-logo">AquaChile</Link>
                <Link to="/" className="btn-volver">← Volver al Inicio</Link>
            </header>

            <main className="form-card-wrapper">
                <div className="form-card">
                    <h2>Únete a Nuestro Equipo</h2>
                    <p className="form-subtitle">Completa tus datos para ingresar al proceso de selección</p>

                    {estado.mensaje && (
                        <div className={`alert-box ${estado.error ? 'alert-error' : 'alert-success'}`}>
                            {estado.mensaje}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="custom-form">
                        <div className="input-group">
                            <label>Nombre Completo</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Maria González" />
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>Correo Electrónico</label>
                                <input type="email" name="correo" value={formData.correo} onChange={handleChange} required placeholder="ejemplo@correo.com" />
                            </div>
                            <div className="input-group">
                                <label>Teléfono</label>
                                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+56 9 1234 5678" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>Familia de Cargo</label>
                                <select name="familiaCargo" value={formData.familiaCargo} onChange={handleChange}>
                                    {Object.keys(opcionesCargos).map(familia => (
                                        <option key={familia} value={familia}>{familia}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Cargo al que postulas</label>
                                <select name="cargoPostulacion" value={formData.cargoPostulacion} onChange={handleChange} required>
                                    {opcionesCargos[formData.familiaCargo].map(cargo => (
                                        <option key={cargo} value={cargo}>{cargo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Adjuntar Currículum Vitae (PDF o Word)</label>
                            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="file-input" />
                        </div>

                        <button type="submit" disabled={estado.loading} className="btn-submit">
                            {estado.loading ? 'Procesando...' : 'Enviar Postulación'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default PostulacionPublica;