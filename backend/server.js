const express = require('express');
const app = express();
app.use(express.json());
app.use('/api/run', require('./routes/algorithmRoutes'));
app.listen(8000, ()=> console.log('listening'));
