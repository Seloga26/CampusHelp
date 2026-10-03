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
