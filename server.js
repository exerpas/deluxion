const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const panelRoutes = require('./routes/panel');
const { requireLicense } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000; // Render inyecta PORT

app.set('trust proxy', 1); // Render está detrás de un proxy: necesario para req.ip y cookies secure
app.disable('x-powered-by');

// CORS: por defecto solo mismo origen. Define CORS_ORIGIN="https://a.com,https://b.com" si lo necesitas.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : false,
  })
);

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
  });
  next();
});

app.use(express.json({ limit: '100kb' }));

// Archivos estáticos públicos (solo el login). El dashboard NO está aquí a propósito.
app.use(express.static(path.join(__dirname, 'public')));

// API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/panel', panelRoutes);

// Páginas
app.get('/dashboard', requireLicense({ redirect: true }), (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// La página de admin es solo la interfaz; todos sus datos están tras la API protegida por ADMIN_KEY.
app.get('/admin', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/healthz', (req, res) => res.send('ok'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Errores (incluye JSON mal formado)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  if (!process.env.ADMIN_KEY) console.warn('⚠️  ADMIN_KEY no está definida: /admin no funcionará.');
});
