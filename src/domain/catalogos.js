// CAPA DE DOMINIO — valores permitidos del negocio (Taller, secciones 2 y 3).

const TIPOS = Object.freeze(['Incidente', 'Solicitud de servicio']);

// P1 = urgente, P2 = normal, P3 = baja
const PRIORIDADES = Object.freeze(['P1', 'P2', 'P3']);

const ROLES = Object.freeze({
  SOLICITANTE: 'Solicitante',
  AGENTE: 'Agente',
  VALIDADOR: 'Validador',
  ADMINISTRADOR: 'Administrador',
});

const LISTA_ROLES = Object.freeze(Object.values(ROLES));

const DESCRIPCION_MINIMA = 10;

module.exports = { TIPOS, PRIORIDADES, ROLES, LISTA_ROLES, DESCRIPCION_MINIMA };
