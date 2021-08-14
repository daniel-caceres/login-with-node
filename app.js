// Dependencias
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Indico donde está la info a esconder
dotenv.config({ path: './.env' });

// Para abrir el servidor.
const app = express();  

// Creo una conexión a la BD.
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});


// Indico donde están los estáticos.
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory)); 

// Para leer req.body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Inicializo la cookie.
app.use(cookieParser())

// Indico que engine view voy a usar.
app.set('view engine', 'hbs');


// Me conecto a la BD.
db.connect((err) => {
  if (err) console.log(err)
  else console.log('Conectado');
})


// Define Routes
app.use('/', require('./routes/rutas'));  // Todas las rutas que ponga las va a buscar a rutas.js
app.use('/auth', require('./routes/auth'));


app.listen(5000,() => {
  console.log('Todo bien');
})
