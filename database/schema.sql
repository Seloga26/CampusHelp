-- CampusHelp — esquema de base de datos (MySQL 8)
-- Basado en schema_CampusHelp.sql del docente. Cambios justificados en
-- docs/decisiones/ADR-002-modelo-de-datos.md:
--   * utf8mb4 para tildes y ñ ("En análisis", "Plataformas académicas")
--   * CHECK en tipo, prioridad, estado y rol (reglas de negocio, sección 7)
--   * correo único por usuario y nombre único de categoría dentro de su área
--   * fecha_inicio_atencion en caso para calcular tiempos de atención (HU-10)
--   * índices para filtros (HU-09)

CREATE DATABASE IF NOT EXISTS campushelp
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campushelp;

DROP TABLE IF EXISTS historial;
DROP TABLE IF EXISTS atencion;
DROP TABLE IF EXISTS caso;
DROP TABLE IF EXISTS categoria;
DROP TABLE IF EXISTS area;
DROP TABLE IF EXISTS usuario;

CREATE TABLE usuario (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(120) NOT NULL,
  correo  VARCHAR(150) NOT NULL UNIQUE,
  rol     VARCHAR(30)  NOT NULL,
  activo  BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_usuario_rol
    CHECK (rol IN ('Solicitante', 'Agente', 'Validador', 'Administrador'))
);

CREATE TABLE area (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80)  NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  activa      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE categoria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  area_id     INT          NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  activa      BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_categoria_area FOREIGN KEY (area_id) REFERENCES area(id),
  CONSTRAINT uq_categoria_area_nombre UNIQUE (area_id, nombre)
);

CREATE TABLE caso (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  tipo                   VARCHAR(25)  NOT NULL,
  titulo                 VARCHAR(180) NOT NULL,
  descripcion            TEXT         NOT NULL,
  prioridad              CHAR(2)      NOT NULL,
  estado                 VARCHAR(30)  NOT NULL DEFAULT 'Pendiente',
  usuario_id             INT          NOT NULL,
  categoria_id           INT          NOT NULL,
  agente_id              INT          NULL,
  fecha_creacion         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_asignacion       DATETIME     NULL,
  fecha_inicio_atencion  DATETIME     NULL,
  fecha_cierre           DATETIME     NULL,
  CONSTRAINT fk_caso_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuario(id),
  CONSTRAINT fk_caso_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id),
  CONSTRAINT fk_caso_agente    FOREIGN KEY (agente_id)    REFERENCES usuario(id),
  CONSTRAINT chk_caso_tipo      CHECK (tipo IN ('Incidente', 'Solicitud de servicio')),
  CONSTRAINT chk_caso_prioridad CHECK (prioridad IN ('P1', 'P2', 'P3')),
  CONSTRAINT chk_caso_estado
    CHECK (estado IN ('Pendiente', 'En análisis', 'En atención', 'En validación', 'Cerrada')),
  CONSTRAINT chk_caso_descripcion CHECK (CHAR_LENGTH(descripcion) >= 10),
  INDEX idx_caso_estado (estado),
  INDEX idx_caso_filtros (tipo, prioridad),
  INDEX idx_caso_usuario (usuario_id),
  INDEX idx_caso_agente (agente_id)
);

CREATE TABLE atencion (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  caso_id     INT      NOT NULL,
  diagnostico TEXT,
  solucion    TEXT,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  agente_id   INT      NOT NULL,
  CONSTRAINT fk_atencion_caso   FOREIGN KEY (caso_id)   REFERENCES caso(id),
  CONSTRAINT fk_atencion_agente FOREIGN KEY (agente_id) REFERENCES usuario(id)
);

CREATE TABLE historial (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  caso_id         INT          NOT NULL,
  evento          VARCHAR(120) NOT NULL,
  estado_anterior VARCHAR(30),
  estado_nuevo    VARCHAR(30),
  usuario_id      INT          NOT NULL,
  fecha           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_caso    FOREIGN KEY (caso_id)    REFERENCES caso(id),
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  INDEX idx_historial_caso (caso_id, fecha)
);
