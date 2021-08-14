// Acá se chequea la data del form y se envía a la base de datos. También se válida el login y el logout.

const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {promisify} = require('util');


const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});


// Función login controla y loguea a los usuarios
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
      if ( !email || !password ) {
        //400 Bad Request response status code indicates that the server cannot or will not process the request due to something that is perceived to be a client error.
        return res.status(400).render('login', {
          message: 'Ingrese el email o el password',
        });
      }

      // Hago la solicitud a la BD
      db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        // La consulta retorna un array.
        // async porque se toma un tiempo en hacer la consulta.
        // bcrypt.compare(ingresado, en la BD), descifra el hash y compara.
        if (!results || !(await bcrypt.compare(password, results[0].password)) ) {
          // 401 Unauthorized client error status response code indicates that the request has not been applied because it lacks valid authentication credentials for the target resource.
          res.status(401).render('login', {
            message: 'Datos erroneos'
          });
        } else {
          // Si todo está bien, agrego las cookies.
          const id = results[0].id;
          // JWT_SECRET se debe guardar en .env
          // jwt.sign({ id: id } es lo mismo que jwt.sign({ id } USA ESTA!!!
          const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            //JWT_EXPIRES_IN se almacena en .env e indica cuando expira la cookie.
            expiresIn: process.env.JWT_EXPIRES_IN, // JWT_EXPIRES_IN es para el token
          });

          const cookieOptions = {
            expires: new Date(
              // JWT_COOKIE_EXPIRES para la cookie.
              // Lo tengo que pasar a miliseconds.
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            // Para asegurar que la cookie se use en un http environment y evirar hackeos.
            httpOnly: true
          };

          // Pone la cookie en el browser.
          res.cookie('jwt', token, cookieOptions); // nombre de la cookie, el token, las caract de la cookie.
          // Lo redirijo al home.
          res.status(200).redirect('/');
        }
      })
  } catch (error) {
    console.log(error);
  }

}

// Función register controla y registra a los usuarios
exports.register = (req, res) => {

  const { name, email, password, passwordConfirm } = req.body;

  // Hago la consulta a la BD.
  db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
    if (error) console.log(error);
    
    // Consulto si esos datos ya existen.
    if (results.length > 0) {
      return res.render('register', {
        message: 'Ese email ya fue usado.'
      });
      // Chequeo que coincidan los passwords.
    } else if (password !== passwordConfirm) {
      return res.render('register', {
        message: 'Los passwords no coinciden.'
      })
    }

    // Encripto el password.
    let hashedPassword = await bcrypt.hash(password, 8); // cantidad de veces a encriptar.
    console.log(hashedPassword);

    // Lo envío a la tabla.
    db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword}, (error, results) => {
      if (error) console.log(error);
      else {
        // console.log(results);
        // Lo envío a auth/register para mostrar el mensaje de usuario
        return res.render('register', {
          messageSuccessful: 'Usuario registrado'
        });
      }
    });
  });
}

// Chequea si un usuario está logueado.
exports.isLoggedIn = async (req, res, next) => {

  // 1) Verify the token.
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        // “promisify” es una simple transformación. Es la conversión de una función que acepta un callback a una función que devuelve una promesa.
        req.cookies.jwt,
        process.env.JWT_SECRET
        ); // decoded es un objeto con el id del usuario logueado.
        
      // 2) Check if the user still exist.
      db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
        
        if (!result) {
          return next();
        }

        req.user = result[0] // Creo la variable user para modificar la página con sus datos.
        return next();
      });
    } catch (error) {
      return next();      
    }
  } else {
    next();  // Pasa a la función que está al lado de authController.isLoggedIn.
  }

}

// Logout: Reemplazar la cookie
exports.logout = async (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 2*1000),
    httpOnly: true
  });
  res.status(200).redirect('/');
}