// backend/src/server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from Quartissimo Backend!');
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
