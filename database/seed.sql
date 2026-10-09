-- Datos iniciales: áreas y categorías del Taller (sección 2) y usuarios de prueba.
USE campushelp;

INSERT INTO usuario (nombre, correo, rol) VALUES
  ('Ana Solicitante',    'ana@campus.edu',    'Solicitante'),
  ('Bruno Solicitante',  'bruno@campus.edu',  'Solicitante'),
  ('Carla Agente',       'carla@campus.edu',  'Agente'),
  ('Diego Agente',       'diego@campus.edu',  'Agente'),
  ('Elena Validadora',   'elena@campus.edu',  'Validador'),
  ('Fabio Administrador','fabio@campus.edu',  'Administrador');

INSERT INTO area (nombre, descripcion) VALUES
  ('Hardware',               'Equipos físicos: computadores, periféricos, proyectores, impresoras'),
  ('Software',               'Instalación, errores y actualización de software institucional'),
  ('Red y conectividad',     'Internet, Wi-Fi institucional y red cableada'),
  ('Cuentas y acceso',       'Contraseñas, bloqueos, correo institucional y permisos'),
  ('Plataformas académicas', 'Campus virtual y sistemas académicos');

INSERT INTO categoria (area_id, nombre) VALUES
  ((SELECT id FROM area WHERE nombre = 'Hardware'), 'Computador'),
  ((SELECT id FROM area WHERE nombre = 'Hardware'), 'Periférico'),
  ((SELECT id FROM area WHERE nombre = 'Hardware'), 'Proyector'),
  ((SELECT id FROM area WHERE nombre = 'Hardware'), 'Impresora'),
  ((SELECT id FROM area WHERE nombre = 'Software'), 'Instalación'),
  ((SELECT id FROM area WHERE nombre = 'Software'), 'Error'),
  ((SELECT id FROM area WHERE nombre = 'Software'), 'Actualización'),
  ((SELECT id FROM area WHERE nombre = 'Red y conectividad'), 'Wi-Fi'),
  ((SELECT id FROM area WHERE nombre = 'Red y conectividad'), 'Internet'),
  ((SELECT id FROM area WHERE nombre = 'Red y conectividad'), 'Red cableada'),
  ((SELECT id FROM area WHERE nombre = 'Cuentas y acceso'), 'Contraseña'),
  ((SELECT id FROM area WHERE nombre = 'Cuentas y acceso'), 'Bloqueo'),
  ((SELECT id FROM area WHERE nombre = 'Cuentas y acceso'), 'Correo'),
  ((SELECT id FROM area WHERE nombre = 'Cuentas y acceso'), 'Permisos'),
  ((SELECT id FROM area WHERE nombre = 'Plataformas académicas'), 'Campus virtual'),
  ((SELECT id FROM area WHERE nombre = 'Plataformas académicas'), 'Sistema académico');

-- Casos de prueba para HU-02, HU-03 y HU-05 (Tarea T0 del Sprint 1)
INSERT INTO caso (tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id, fecha_creacion) VALUES
  -- Casos de Ana (ID 1)
  ('Incidente', 'Pantalla azul en portátil', 'Al encender sale error crítico', 'P1', 'Pendiente', 1, 1, '2026-10-05 08:00:00'),
  ('Solicitud de servicio', 'Instalar Photoshop', 'Requerido para diseño gráfico', 'P2', 'En análisis', 1, 5, '2026-10-05 09:30:00'),
  
  -- Caso de Bruno (ID 2)
  ('Incidente', 'No conecta al Wi-Fi', 'Falla en el bloque C segundo piso', 'P1', 'Pendiente', 2, 8, '2026-10-05 08:15:00'),
  
  -- Caso Cerrado para probar que también se ven
  ('Solicitud de servicio', 'Cambio de teclado', 'Teclas pegajosas por café', 'P3', 'Cerrada', 1, 2, '2026-10-04 15:00:00');
