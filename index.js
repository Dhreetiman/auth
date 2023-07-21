
const express = require("express");
let connectDB = require("./src/configs/db");
const app = express();

// middlewares
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));


// Mongodb Database connection
connectDB();


// Routes
app.use('/', require('./src/routes/userRoutes'))

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Hello, This is Default Page' });
});

// Running Port
app.listen(8080, () => {
  console.log(`Server is running on Port ${8080}`);
});
