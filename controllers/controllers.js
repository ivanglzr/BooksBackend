const { error, log } = require("console");
const Book = require("../models/book");

const fs = require("fs");
const path = require("path");

function validateString(str) {
  if (!str || str.trim().length === 0 || str === null || str === undefined)
    return false;
  return true;
}

function validateNumber(num) {
  if (num < 0 || typeof num !== "number") {
    return false;
  }

  return true;
}

const controllers = {
  test: (req, res) => {
    return res.status(200).json({
      status: "success",
    });
  },

  saveBook: (req, res) => {
    const { title, author, pages, readed } = req.body;

    if (
      !validateString(title) ||
      !validateString(author) ||
      !validateNumber(pages) ||
      !validateNumber(readed)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Faltan datos o los datos son inválidos",
      });
    }

    Book.find({ title: title }).then((books) => {
      if (books.length > 0) {
        return res.status(500).json({
          status: "error",
          message: "El libro ya existe en la base de datos",
        });
      }

      // Si no se encontró un libro con el mismo título, entonces podemos guardar el libro
      const book = new Book({
        title: title,
        author: author,
        pages: pages,
        readed: readed,
        image: null,
      });

      book
        .save()
        .then((bookStored) => {
          return res.status(200).json({
            status: "success",
            book: bookStored,
          });
        })
        .catch((err) => {
          return res.status(500).json({
            status: "error",
            message: "No se ha podido guardar el libro",
          });
        });
    });
  },

  getBooks: (req, res) => {
    const searchString = req.body.search;

    const id = req.params.id;

    if (id) {
      Book.findById(id)
        .then((book) => {
          if (!book) {
            return res.status(404).json({
              status: "error",
              message: "No se ha encontrado el libro",
            });
          }

          return res.status(200).json({
            status: "success",
            book: book,
          });
        })
        .catch((err) => {
          return res.status(500).json({
            status: "error",
            message: "Ha ocurrido un error en la peticion",
          });
        });
      return;
    }

    if (!validateString(searchString)) {
      return res.status(404).json({
        status: "error",
        message: "No se ha enviado la busqueda",
      });
    }

    Book.find({
      $or: [
        { title: { $regex: searchString, $options: "i" } },
        { author: { $regex: searchString, $options: "i" } },
      ],
    })
      .then((books) => {
        if (!books || books.length <= 0) {
          return res.status(404).json({
            status: "error",
            message: "No se han encontrado libros",
          });
        }

        return res.status(200).json({
          status: "success",
          book: books,
        });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({
          status: "error",
          message: "Error en la peticion",
        });
      });
  },

  updateBook: (req, res) => {
    const id = req.params.id;

    const { title, author, pages, readed } = req.body;

    const book = {
      title: title,
      author: author,
      pages: pages,
      readed: readed,
      image: null,
    };

    Book.findOneAndUpdate({ _id: id }, book, { new: true })
      .then((book) => {
        if (!book) {
          return res.status(404).json({
            status: "error",
            message: "No se encontro el libro a actualizar",
          });
        }

        return res.status(200).json({
          status: "success",
          book: book,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          status: "error",
          message: "Error al actualizar",
        });
      });
  },

  deleteBook: (req, res) => {
    const id = req.params.id;

    Book.findOneAndDelete({ _id: id })
      .then((book) => {
        if (!book) {
          return res.status(404).json({
            status: "error",
            message: "No se encontró el libro a eliminar",
          });
        }

        // Antes de eliminar el libro de la base de datos, asegúrate de eliminar el archivo de imagen
        const imagePath = `upload/images/${book.image}`;
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error al eliminar la imagen:", err);
          }
        });

        return res.status(200).json({
          status: "success",
          message: "Libro eliminado exitosamente",
          book: book,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          status: "error",
          message: "Ha ocurrido un error al eliminar el libro",
        });
      });
  },

  uploadImage: (req, res) => {
    if (!req.files) {
      return res.status(404).json({
        status: "error",
        message: "Imagen no subida",
      });
    }

    // Conseguir nombre y extension
    const file_pat = req.files.file0.path;
    console.log(file_pat);
    const file_split = file_pat.split("\\");

    const file_name = file_split[2];

    const file_ext = file_name.split(".")[1];

    if (
      file_ext != "png" &&
      file_ext != "jpg" &&
      file_ext != "jpeg" &&
      file_ext != "gif"
    ) {
      // Borrar el archivo
      fs.unlink(file_pat).then((err) => {
        return res.status(500).json({
          status: "error",
          message: "La extension de la imagen no es valida",
        });
      });

      return;
    }

    let id = req.params.id;

    // Se encuentra el archivo y se pasa la imagen mediante los params
    Book.findOneAndUpdate({ _id: id }, { image: file_name }, { new: true })
      .then((book) => {
        if (!book) {
          return res.status(404).json({
            status: "error",
            message: "No se ha encontrado el archivo",
          });
        }

        return res.status(200).json({
          status: "success",
          book: book,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          status: "error",
          message: "No se ha subido la imagen",
        });
      });
  },

  getImage: (req, res) => {
    const image = req.params.image;

    const path_file = `./upload/images/${image}`; // Reemplaza esto con la ruta real del archivo que deseas verificar

    fs.access(path_file, fs.constants.F_OK, (err) => {
      if (err) {
        if (err.code === "ENOENT") {
          return res.status(404).send({
            status: "error",
            message: "La imagen no existe",
          });
        } else {
          // Manejo de otros errores que puedan ocurrir al verificar la existencia del archivo
          return res.status(500).send({
            status: "error",
            message: "Error al verificar la existencia del archivo",
          });
        }
      } else {
        // El archivo existe, envía el archivo como respuesta
        return res.sendFile(path.resolve(path_file));
      }
    });
  },
};

module.exports = controllers;
