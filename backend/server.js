const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const manzanasRoutes = require('./src/routes/manzanas');
const viviendasRoutes = require('./src/routes/viviendas');
const partidasRoutes = require('./src/routes/partidas');
const tareasRoutes = require('./src/routes/tareas');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/manzanas', manzanasRoutes);
app.use('/api/viviendas', viviendasRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/tareas', tareasRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});