import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    FiArrowLeft, FiUploadCloud, FiAlertCircle,
    FiCheckCircle, FiX, FiSearch
} from 'react-icons/fi';
import api from '../services/api';
import './PostulacionPublica.css';

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const opcionesCargosRespaldo = {
    Operativo: ['Operario de Planta', 'Asistente de Producción', 'Técnico de Mantenimiento', 'Operario de Grúa'],
    Administrativo: ['Asistente Administrativo', 'Analista Contable', 'Recepcionista', 'Ejecutivo de RRHH'],
    Jefatura: ['Jefe de Turno', 'Jefe de Planta', 'Supervisor de Área', 'Jefe de Logística'],
    Gerencia: ['Gerente de Operaciones', 'Gerente Comercial', 'Gerente de Finanzas'],
    TI: ['Desarrollador Java', 'Analista de Sistemas', 'Soporte TI']
};

const PostulacionPublica = () => {
    const [searchParams] = useSearchParams();
    const [cargosDisponibles, setCargosDisponibles] = useState(opcionesCargosRespaldo);

    const [formData, setFormData] = useState({
        rut: '',
        nombre: '',
        fechaNacimiento: '',
        correo: '',
        telefono: '',
        familiaCargo: 'Operativo',
        cargoPostulacion: opcionesCargosRespaldo['Operativo'][0]
    });

    const [cvFile, setCvFile] = useState(null);
    const [estado, setEstado] = useState({ loading: false, mensaje: '', error: false });
    const [modalExitoOpen, setModalExitoOpen] = useState(false);
    const [cargoPostuladoExito, setCargoPostuladoExito] = useState('');
    const [erroresCampos, setErroresCampos] = useState({});

    useEffect(() => {
        window.scrollTo(0, 0);

        const inicializarCargos = async () => {
            let mapaCargos = opcionesCargosRespaldo;

            try {
                const { data } = await api.get('/ofertas/public');
                if (Array.isArray(data) && data.length > 0) {
                    const agrupados = data.reduce((acc, oferta) => {
                        const fam = oferta.familiaCargo || 'General';
                        if (!acc[fam]) acc[fam] = [];
                        if (!acc[fam].includes(oferta.tituloCargo)) {
                            acc[fam].push(oferta.tituloCargo);
                        }
                        return acc;
                    }, {});
                    mapaCargos = agrupados;
                }
            } catch (err) {
                console.error('No se pudieron obtener ofertas públicas, usando listado base:', err);
            }

            setCargosDisponibles(mapaCargos);

            const familias = Object.keys(mapaCargos);
            const familiaUrl = searchParams.get('familia');
            const cargoUrl = searchParams.get('cargo');

            if (familiaUrl && mapaCargos[familiaUrl]) {
                const cargoValido = mapaCargos[familiaUrl].includes(cargoUrl)
                    ? cargoUrl
                    : mapaCargos[familiaUrl][0];
                setFormData(prev => ({
                    ...prev,
                    familiaCargo: familiaUrl,
                    cargoPostulacion: cargoValido
                }));
            } else if (familias.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    familiaCargo: familias[0],
                    cargoPostulacion: mapaCargos[familias[0]][0]
                }));
            }
        };

        inicializarCargos();
    }, [searchParams]);

    // Auto-cerrar toast de error después de 5 segundos
    useEffect(() => {
        if (!estado.error || !estado.mensaje) return;
        const timer = setTimeout(() => {
            setEstado(prev => ({ ...prev, mensaje: '', error: false }));
        }, 5000);
        return () => clearTimeout(timer);
    }, [estado.error, estado.mensaje]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setErroresCampos(prev => ({ ...prev, [name]: null }));

        if (name === 'familiaCargo') {
            const cargosFamilia = cargosDisponibles[value] || [];
            setFormData({
                ...formData,
                familiaCargo: value,
                cargoPostulacion: cargosFamilia[0] || ''
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) {
            setCvFile(null);
            return;
        }

        const esPdf =
            archivo.type === 'application/pdf' ||
            archivo.name.toLowerCase().endsWith('.pdf');

        if (!esPdf) {
            setCvFile(null);
            e.target.value = '';
            setErroresCampos(prev => ({
                ...prev,
                cvFile: 'Solo se permiten archivos en formato PDF.'
            }));
            return;
        }

        if (archivo.size > MAX_PDF_SIZE_BYTES) {
            setCvFile(null);
            e.target.value = '';
            setErroresCampos(prev => ({
                ...prev,
                cvFile: 'El archivo supera el tamaño máximo permitido de 5 MB.'
            }));
            return;
        }

        setCvFile(archivo);
        setErroresCampos(prev => ({ ...prev, cvFile: null }));
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        const rutRegex = /^[0-9]+-[0-9kK]{1}$/;
        const phoneRegex = /^\+?[0-9\s]{8,15}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.rut.trim()) nuevosErrores.rut = 'El RUT es obligatorio.';
        else if (!rutRegex.test(formData.rut.trim())) nuevosErrores.rut = 'Formato inválido sin puntos y con guion (Ej: 12345678-9).';

        if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio.';

        if (!formData.fechaNacimiento) nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';

        if (!formData.correo.trim()) nuevosErrores.correo = 'El correo es obligatorio.';
        else if (!emailRegex.test(formData.correo.trim())) nuevosErrores.correo = 'Ingresa un correo electrónico válido.';

        if (!formData.telefono.trim()) nuevosErrores.telefono = 'El teléfono es obligatorio.';
        else if (!phoneRegex.test(formData.telefono.trim())) nuevosErrores.telefono = 'Formato inválido (Ej: +56912345678).';

        if (!cvFile) {
            nuevosErrores.cvFile = 'Debes adjuntar tu Currículum Vitae en PDF.';
        } else if (cvFile.size > MAX_PDF_SIZE_BYTES) {
            nuevosErrores.cvFile = 'El archivo supera el tamaño máximo permitido de 5 MB.';
        }

        setErroresCampos(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setEstado({ loading: true, mensaje: '', error: false });

        try {
            const payload = {
                ...formData,
                rut: formData.rut.trim(),
                nombre: formData.nombre.trim(),
                correo: formData.correo.trim(),
                telefono: formData.telefono.trim()
            };

            const data = new FormData();
            data.append('candidato', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
            data.append('cv', cvFile);

            await api.post('/postulaciones/public', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const primeraFamilia = Object.keys(cargosDisponibles)[0] || 'Operativo';
            setCargoPostuladoExito(payload.cargoPostulacion);
            setEstado({
                loading: false,
                mensaje: '¡Postulación enviada con éxito! Te contactaremos pronto.',
                error: false
            });
            setModalExitoOpen(true);

            setFormData({
                rut: '',
                nombre: '',
                fechaNacimiento: '',
                correo: '',
                telefono: '',
                familiaCargo: primeraFamilia,
                cargoPostulacion: (cargosDisponibles[primeraFamilia] || [])[0] || ''
            });
            setCvFile(null);
            e.target.reset();
        } catch (error) {
            setEstado({
                loading: false,
                mensaje:
                    error.response?.data?.message ||
                    'Hubo un error al enviar la postulación. Verifica que tu RUT o correo no estén registrados previamente.',
                error: true
            });
        }
    };

    const familias = Object.keys(cargosDisponibles);
    const cargosDeFamiliaActual = cargosDisponibles[formData.familiaCargo] || [];

    return (
        <div className="postulacion-page">
            <header className="postulacion-header">
                <Link to="/" className="logo-brand">
                    <div className="logo-icon-small">🌊</div>
                    <span>AquaChile</span>
                </Link>
                <Link to="/cargos" className="link-volver">
                    <FiArrowLeft /> Volver a Oportunidades
                </Link>
            </header>

            {/* NOTIFICACIÓN FLOTANTE (ESQUINA SUPERIOR DERECHA) PARA ERRORES */}
            {estado.error && estado.mensaje && (
                <div className="postulacion-floating-toast toast-error" role="alert">
                    <FiAlertCircle className="floating-toast-icon" />
                    <span>{estado.mensaje}</span>
                    <button
                        type="button"
                        className="floating-toast-close"
                        onClick={() => setEstado(prev => ({ ...prev, mensaje: '', error: false }))}
                        aria-label="Cerrar notificación"
                    >
                        <FiX />
                    </button>
                </div>
            )}

            <main className="postulacion-container">
                <div className="form-card-modern">
                    <div className="form-header-modern">
                        <h2>Portal de Postulación</h2>
                        <p>Completa el siguiente formulario para ingresar a nuestro proceso de selección.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="modern-form" noValidate>
                        <div className="form-section-title">Datos Personales</div>

                        <div className="form-row-modern">
                            <div className="input-group-modern">
                                <label htmlFor="rut">RUT <span className="required-mark">*</span></label>
                                <input
                                    id="rut"
                                    type="text"
                                    name="rut"
                                    value={formData.rut}
                                    onChange={handleChange}
                                    placeholder="12345678-9"
                                    maxLength={12}
                                    className={erroresCampos.rut ? 'input-error' : ''}
                                />
                                {erroresCampos.rut && (
                                    <span className="error-message">
                                        <FiAlertCircle className="error-icon" /> {erroresCampos.rut}
                                    </span>
                                )}
                            </div>
                            <div className="input-group-modern">
                                <label htmlFor="nombre">Nombre Completo <span className="required-mark">*</span></label>
                                <input
                                    id="nombre"
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: María González"
                                    className={erroresCampos.nombre ? 'input-error' : ''}
                                />
                                {erroresCampos.nombre && (
                                    <span className="error-message">
                                        <FiAlertCircle className="error-icon" /> {erroresCampos.nombre}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="form-row-modern">
                            <div className="input-group-modern">
                                <label htmlFor="fechaNacimiento">Fecha de Nacimiento <span className="required-mark">*</span></label>
                                <input
                                    id="fechaNacimiento"
                                    type="date"
                                    name="fechaNacimiento"
                                    value={formData.fechaNacimiento}
                                    onChange={handleChange}
                                    className={erroresCampos.fechaNacimiento ? 'input-error' : ''}
                                />
                                {erroresCampos.fechaNacimiento && (
                                    <span className="error-message">
                                        <FiAlertCircle className="error-icon" /> {erroresCampos.fechaNacimiento}
                                    </span>
                                )}
                            </div>
                            <div className="input-group-modern">
                                <label htmlFor="telefono">Teléfono <span className="required-mark">*</span></label>
                                <input
                                    id="telefono"
                                    type="text"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="+56912345678"
                                    maxLength={15}
                                    className={erroresCampos.telefono ? 'input-error' : ''}
                                />
                                {erroresCampos.telefono && (
                                    <span className="error-message">
                                        <FiAlertCircle className="error-icon" /> {erroresCampos.telefono}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="input-group-modern full-width">
                            <label htmlFor="correo">Correo Electrónico <span className="required-mark">*</span></label>
                            <input
                                id="correo"
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                placeholder="ejemplo@correo.com"
                                className={erroresCampos.correo ? 'input-error' : ''}
                            />
                            {erroresCampos.correo && (
                                <span className="error-message">
                                    <FiAlertCircle className="error-icon" /> {erroresCampos.correo}
                                </span>
                            )}
                        </div>

                        <div className="form-section-title">Detalles de la Postulación</div>

                        <div className="form-row-modern">
                            <div className="input-group-modern">
                                <label htmlFor="familiaCargo">Familia de Cargo</label>
                                <select
                                    id="familiaCargo"
                                    name="familiaCargo"
                                    value={formData.familiaCargo}
                                    onChange={handleChange}
                                    className="modern-select"
                                >
                                    {familias.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group-modern">
                                <label htmlFor="cargoPostulacion">Cargo al que Postula</label>
                                <select
                                    id="cargoPostulacion"
                                    name="cargoPostulacion"
                                    value={formData.cargoPostulacion}
                                    onChange={handleChange}
                                    className="modern-select"
                                >
                                    {cargosDeFamiliaActual.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-section-title">Documentación</div>

                        <div className="input-group-modern full-width">
                            <label htmlFor="cv-upload">
                                Currículum Vitae (PDF, máx. 5 MB) <span className="required-mark">*</span>
                            </label>
                            <div className={`file-upload-wrapper ${erroresCampos.cvFile ? 'upload-error' : ''}`}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,application/pdf"
                                    className="modern-file-input"
                                    id="cv-upload"
                                />
                                <label htmlFor="cv-upload" className="file-upload-label">
                                    <FiUploadCloud className="upload-icon" />
                                    <span>
                                        {cvFile
                                            ? `${cvFile.name} (${(cvFile.size / (1024 * 1024)).toFixed(2)} MB)`
                                            : 'Haz clic para seleccionar o arrastra tu CV en PDF aquí (máx. 5 MB)'}
                                    </span>
                                </label>
                            </div>
                            {erroresCampos.cvFile && (
                                <span className="error-message">
                                    <FiAlertCircle className="error-icon" /> {erroresCampos.cvFile}
                                </span>
                            )}
                        </div>

                        <div className="form-actions-modern">
                            <button type="submit" disabled={estado.loading} className="btn-submit-modern">
                                {estado.loading ? 'Procesando...' : 'Enviar Postulación'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* POP-UP MODAL DE CONFIRMACIÓN EXITOSA */}
            {modalExitoOpen && (
                <div className="postulacion-modal-overlay" onClick={() => setModalExitoOpen(false)}>
                    <div
                        className="postulacion-success-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="postulacion-modal-close"
                            onClick={() => setModalExitoOpen(false)}
                            aria-label="Cerrar"
                        >
                            <FiX />
                        </button>

                        <div className="success-modal-icon">
                            <FiCheckCircle />
                        </div>

                        <h3>¡Postulación enviada con éxito!</h3>
                        <p className="success-modal-text">
                            {estado.mensaje || '¡Postulación enviada con éxito! Te contactaremos pronto.'}
                        </p>

                        {cargoPostuladoExito && (
                            <div className="success-cargo-chip">
                                Postulación registrada para: <strong>{cargoPostuladoExito}</strong>
                            </div>
                        )}

                        <div className="success-modal-actions">
                            <Link to="/estado" className="btn-modal-primary">
                                <FiSearch /> Consultar Estado
                            </Link>
                            <button
                                type="button"
                                className="btn-modal-secondary"
                                onClick={() => setModalExitoOpen(false)}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostulacionPublica;