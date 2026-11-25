package com.duoc.aquachile.config;

import com.duoc.aquachile.model.Oferta;
import com.duoc.aquachile.model.RolUsuario;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.OfertaRepository;
import com.duoc.aquachile.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner cargarDatos(
            UsuarioRepository usuarioRepository,
            OfertaRepository ofertaRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Crear usuario administrador inicial si no existen usuarios
            if (usuarioRepository.count() == 0) {
                Usuario admin = new Usuario();
                admin.setNombre("Admin General");
                admin.setCorreo("admin@aquachile.cl");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRol(RolUsuario.ADMIN);

                usuarioRepository.save(admin);
                System.out.println("Usuario administrador creado automáticamente: admin@aquachile.cl / admin123");
            }

            // 2. Precargar las 15 ofertas base (solo las que no existan aún por título)
            List<Oferta> ofertasBase = List.of(
                    // ==================== OPERATIVO ====================
                    crearOfertaBase(
                            "Operario de Planta", "Operativo", "Puerto Montt, Los Lagos", "Presencial", 10,
                            "Integrar líneas de proceso en planta de alimentos marinos asegurando estándares de inocuidad y seguridad.",
                            "Ejecutar labores en línea de producción, empaque, clasificación y cumplimiento de normas BPM y HACCP.",
                            "Enseñanza media completa. Disponibilidad para turnos rotativos. Deseable experiencia en plantas de alimentos.",
                            "Buses de acercamiento, casino en planta, seguro complementario de salud y bono de producción.",
                            "$620.000 - $720.000 líquido"
                    ),
                    crearOfertaBase(
                            "Asistente de Producción", "Operativo", "Puerto Montt, Los Lagos", "Presencial", 4,
                            "Apoyar la coordinación operativa de líneas de proceso, control de registros diarios y trazabilidad.",
                            "Registrar rendimientos en planillas, verificar cumplimiento de parámetros de calidad y reportar desvíos.",
                            "1 año de experiencia en entornos productivos o acuícolas. Manejo básico-intermedio de Excel.",
                            "Buses de acercamiento, casino, seguro complementario y bono por cumplimiento de metas.",
                            "$750.000 - $880.000 líquido"
                    ),
                    crearOfertaBase(
                            "Técnico de Mantenimiento", "Operativo", "Puerto Montt, Los Lagos", "Presencial", 3,
                            "Ejecutar planes de mantención preventiva y correctiva de maquinaria industrial y sistemas de refrigeración.",
                            "Diagnosticar fallas electromecánicas, operar equipos PLC y asegurar la continuidad operacional bajo normas de seguridad.",
                            "Título Técnico en Electromecánica, Mantenimiento Industrial o afín. Mínimo 2 años de experiencia.",
                            "Seguro complementario de salud, bonos de turno, capacitación técnica continua y casino.",
                            "$1.050.000 - $1.250.000 líquido"
                    ),
                    crearOfertaBase(
                            "Operario de Grúa", "Operativo", "Puerto Montt, Los Lagos", "Presencial", 3,
                            "Operar grúa horquilla y apilador eléctrico en bodegas y cámaras frigoríficas de despacho.",
                            "Trasladar pallets, controlar inventarios de entrada/salida y realizar chequeos preventivos de la maquinaria.",
                            "Licencia de conducir Clase D vigente (excluyente). Al menos 1 año de experiencia en bodega o frigorífico.",
                            "Buses de acercamiento, ropa térmica certificada, casino y seguro complementario.",
                            "$780.000 - $900.000 líquido"
                    ),

                    // ==================== ADMINISTRATIVO ====================
                    crearOfertaBase(
                            "Asistente Administrativo", "Administrativo", "Puerto Montt, Los Lagos", "Híbrida", 2,
                            "Brindar soporte administrativo, documental y de facturación a las áreas operativas y comerciales.",
                            "Gestionar órdenes de compra, archivo documental, atención a proveedores y actualización de registros en ERP.",
                            "Técnico en Administración o afín. 1 año de experiencia. Manejo de Excel intermedio y deseable SAP.",
                            "Modalidad híbrida, seguro complementario de salud, aguinaldos y tarjeta de alimentación.",
                            "$800.000 - $950.000 líquido"
                    ),
                    crearOfertaBase(
                            "Analista Contable", "Administrativo", "Puerto Montt, Los Lagos", "Híbrida", 2,
                            "Ejecutar análisis de cuentas, conciliaciones bancarias y cierres contables bajo normativa IFRS.",
                            "Preparar declaraciones tributarias ante el SII, apoyar auditorías externas y gestionar registros en ERP.",
                            "Título de Contador Auditor o afín. Mínimo 2 años de experiencia en contabilidad y manejo de SAP o Softland.",
                            "Modalidad híbrida, seguro complementario, bono anual por desempeño y convenios de salud.",
                            "$1.150.000 - $1.400.000 líquido"
                    ),
                    crearOfertaBase(
                            "Recepcionista", "Administrativo", "Puerto Montt, Los Lagos", "Presencial", 1,
                            "Atender a visitas, proveedores y colaboradores, coordinando central telefónica y control de acceso.",
                            "Recibir correspondencia, coordinar salas de reuniones, derivar llamadas y mantener registro de ingresos.",
                            "Al menos 1 año de experiencia en recepción corporativa o atención a público. Manejo de Office.",
                            "Seguro complementario de salud, bono de locomoción, casino y aguinaldos.",
                            "$650.000 - $750.000 líquido"
                    ),
                    crearOfertaBase(
                            "Ejecutivo de RRHH", "Administrativo", "Puerto Montt, Los Lagos", "Híbrida", 2,
                            "Gestionar el ciclo laboral de colaboradores: contratos, asistencia, remuneraciones y trámites laborales.",
                            "Administrar plataforma Buk, emitir anexos y finiquitos, atender consultas internas y asegurar cumplimiento legal.",
                            "Ingeniero o Técnico en RRHH. 2 años de experiencia en legislación laboral chilena y software de remuneraciones.",
                            "Modalidad híbrida, seguro complementario de salud, capacitaciones y bonos corporativos.",
                            "$1.100.000 - $1.350.000 líquido"
                    ),

                    // ==================== JEFATURA ====================
                    crearOfertaBase(
                            "Jefe de Turno", "Jefatura", "Puerto Montt, Los Lagos", "Presencial", 2,
                            "Liderar equipos operativos en planta asegurando el cumplimiento de metas diarias de producción y seguridad.",
                            "Supervisar dotación en turno, gestionar KPIs productivos, resolver contingencias y velar por la inocuidad.",
                            "Ingeniero en Alimentos, Industrial o afín. Mínimo 3 años liderando equipos en plantas productivas.",
                            "Seguro complementario familiar, bono por cumplimiento de KPIs, casino y desarrollo de carrera.",
                            "$1.600.000 - $1.950.000 líquido"
                    ),
                    crearOfertaBase(
                            "Jefe de Planta", "Jefatura", "Puerto Montt, Los Lagos", "Presencial", 1,
                            "Dirigir la operación integral de planta de proceso en industria acuícola con foco en eficiencia y calidad.",
                            "Gestionar presupuesto operacional, liderar jefaturas de turno, impulsar mejora continua y mantener certificaciones.",
                            "Ingeniero en Alimentos, Civil Industrial o afín. Mínimo 4 años de experiencia en plantas salmoneras o alimentarias.",
                            "Seguro complementario familiar, bono anual por resultados, asignación de vehículo y beneficios corporativos.",
                            "$2.600.000 - $3.200.000 líquido"
                    ),
                    crearOfertaBase(
                            "Supervisor de Área", "Jefatura", "Puerto Montt, Los Lagos", "Presencial", 2,
                            "Coordinar equipos operativos de área específica garantizando estándares de calidad e inocuidad.",
                            "Controlar indicadores diarios, capacitar a personal nuevo, reportar desvíos y apoyar auditorías de calidad.",
                            "Formación técnica o profesional afín. Mínimo 2 años supervisando personas en entornos productivos.",
                            "Buses de acercamiento, casino, seguro complementario y bono trimestral.",
                            "$1.250.000 - $1.500.000 líquido"
                    ),
                    crearOfertaBase(
                            "Jefe de Logística", "Jefatura", "Puerto Montt, Los Lagos", "Presencial", 1,
                            "Planificar y controlar la cadena de frío, almacenamiento y despachos nacionales y de exportación.",
                            "Administrar inventarios en WMS, coordinar transportistas y asegurar continuidad de cadena de frío.",
                            "Ingeniero en Logística o Industrial. Mínimo 3 años liderando logística, cadena de frío y exportaciones.",
                            "Seguro complementario familiar, bono de desempeño anual y beneficios corporativos.",
                            "$1.900.000 - $2.300.000 líquido"
                    ),

                    // ==================== GERENCIA ====================
                    crearOfertaBase(
                            "Gerente de Operaciones", "Gerencia", "Puerto Montt, Los Lagos", "Presencial", 1,
                            "Liderar la estrategia operacional multi-planta optimizando costos, EBITDA y sustentabilidad.",
                            "Dirigir gerencias y jefaturas de planta, gestionar P&L, liderar proyectos Lean Manufacturing y transformación operacional.",
                            "Ingeniero Civil Industrial o afín. Mínimo 6 años en dirección de operaciones en acuicultura o manufactura.",
                            "Paquete ejecutivo con bono anual por EBITDA, seguro de salud premium y beneficios corporativos.",
                            "$4.500.000 - $5.500.000 líquido"
                    ),
                    crearOfertaBase(
                            "Gerente Comercial", "Gerencia", "Puerto Montt, Los Lagos", "Híbrida", 1,
                            "Diseñar y ejecutar la estrategia comercial de expansión en mercados internacionales B2B.",
                            "Negociar con clientes globales, proteger márgenes de rentabilidad y liderar el equipo comercial de exportación.",
                            "Ingeniero Comercial o afín. Mínimo 6 años en exportación B2B e inglés avanzado (C1).",
                            "Modalidad híbrida, bono anual comercial, seguro de salud premium y viáticos internacionales.",
                            "$4.200.000 - $5.200.000 líquido"
                    ),
                    crearOfertaBase(
                            "Gerente de Finanzas", "Gerencia", "Puerto Montt, Los Lagos", "Híbrida", 1,
                            "Dirigir la planificación financiera, control de gestión, tesorería y relación con entidades bancarias.",
                            "Administrar flujo de caja, presupuestos corporativos, gestión de riesgos financieros y reportabilidad IFRS.",
                            "Ingeniero Comercial o Contador Auditor (deseable MBA). Mínimo 6 años en finanzas corporativas.",
                            "Modalidad híbrida, bono ejecutivo anual, seguro de salud premium y beneficios corporativos.",
                            "$4.500.000 - $5.500.000 líquido"
                    )
            );

            int creadas = 0;
            for (Oferta oferta : ofertasBase) {
                if (!ofertaRepository.existsByTituloCargoIgnoreCase(oferta.getTituloCargo())) {
                    ofertaRepository.save(oferta);
                    creadas++;
                }
            }

            if (creadas > 0) {
                System.out.println("Ofertas base precargadas automáticamente: " + creadas);
            }
        };
    }

    private Oferta crearOfertaBase(
            String tituloCargo,
            String familiaCargo,
            String ubicacion,
            String modalidad,
            int cupos,
            String descripcion,
            String funcionesPrincipales,
            String requisitos,
            String beneficios,
            String rangoSalarial) {
        Oferta o = new Oferta();
        o.setTituloCargo(tituloCargo);
        o.setFamiliaCargo(familiaCargo);
        o.setUbicacion(ubicacion);
        o.setModalidad(modalidad);
        o.setCuposDisponibles(cupos);
        o.setDescripcion(descripcion);
        o.setFuncionesPrincipales(funcionesPrincipales);
        o.setRequisitos(requisitos);
        o.setBeneficios(beneficios);
        o.setRangoSalarial(rangoSalarial);
        o.setEstadoActivo(true);
        return o;
    }
}