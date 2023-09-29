"use strict";

const mongoose = require("mongoose");
const app = require("./app");

const port = 3900;
const url = "mongodb://localhost:27017/books_db";

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4,
  })
  .then(() => {
    // Comprobar conexion
    console.log("Conectado");

    // Crear servidor y escuchar peticiones
    app.listen(port, () => {
      console.log("Servidor corriendo en el puerto:", port);
    });
  })
  .catch((err) => console.log(err));
