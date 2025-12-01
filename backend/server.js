const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors( origin='*' ));
app.use(express.json());
app.use('/api/run', require('./routes/algorithmRoutes'));
app.listen(8000, ()=> console.log('listening at the port 8000'));
