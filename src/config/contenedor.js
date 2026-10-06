// CONFIGURACIÓN — "raíz de composición": el ÚNICO lugar donde se conectan
// las piezas concretas (MySQL → repositorios → servicios).
//
// Inversión de dependencias (D de SOLID): los servicios no crean sus
// dependencias; las reciben de aquí. En las pruebas se usa un contenedor
// falso con repositorios en memoria (ver tests/api/app.test.js).
//
// Para agregar un caso de uso nuevo:
//   1. crea src/services/<modulo>/<casoDeUso>.js con crearX({ repos, enTransaccion })
//   2. regístralo abajo en `servicios`
//   3. úsalo en la ruta correspondiente de src/routes/

const { crearCategoriasRepository } = require('../repositories/categoriasRepository');
const { crearUsuariosRepository } = require('../repositories/usuariosRepository');
const { crearCasosRepository } = require('../repositories/casosRepository');
const { crearHistorialRepository } = require('../repositories/historialRepository');

const { crearListarCategorias } = require('../services/catalogos/listarCategorias');
const { crearListarUsuarios } = require('../services/catalogos/listarUsuarios');
const { crearRegistrarCaso } = require('../services/casos/registrarCaso');
const { crearListarCasos } = require('../services/casos/listarCasos');
const { crearCambiarEstado } = require('../services/casos/cambiarEstado');

/** Construye todos los repositorios sobre un mismo ejecutor (pool o conexión). */
function crearRepositorios(ejecutor) {
  return {
    categorias: crearCategoriasRepository(ejecutor),
    usuarios: crearUsuariosRepository(ejecutor),
    casos: crearCasosRepository(ejecutor),
    historial: crearHistorialRepository(ejecutor),
  };
}

/**
 * Ejecuta `trabajo(tx)` dentro de una transacción. `tx` tiene los mismos
 * repositorios que `repos`, pero todos usan la misma conexión: si algo
 * falla, se deshace todo (ROLLBACK).
 */
function crearEnTransaccion(pool) {
  return async function enTransaccion(trabajo) {
    const conexion = await pool.getConnection();
    let iniciada = false;
    try {
      await conexion.beginTransaction();
      iniciada = true;
      const resultado = await trabajo(crearRepositorios(conexion));
      await conexion.commit();
      return resultado;
    } catch (err) {
      if (iniciada) {
        try { await conexion.rollback(); } catch { /* Conservar el error original. */ }
      }
      throw err;
    } finally {
      conexion.release();
    }
  };
}

/** Arma los servicios a partir de sus dependencias. Se usa igual en producción y en pruebas. */
function crearServicios({ repos, enTransaccion }) {
  const deps = { repos, enTransaccion };
  return {
    listarCategorias: crearListarCategorias(deps),
    listarUsuarios: crearListarUsuarios(deps),
    registrarCaso: crearRegistrarCaso(deps), // HU-01
    listarCasos: crearListarCasos(deps), // HU-02 / HU-03
    cambiarEstado: crearCambiarEstado(deps), // HU-05
  };
}

function crearContenedor(pool) {
  return {
    servicios: crearServicios({
      repos: crearRepositorios(pool),
      enTransaccion: crearEnTransaccion(pool),
    }),
    verificarBaseDeDatos: () => pool.query('SELECT 1'),
  };
}

module.exports = { crearContenedor, crearServicios, crearRepositorios };
