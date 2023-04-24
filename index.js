const crypto = require("crypto");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const express = require("express");
const multer = require("multer");
const { GridFSPromise } = require("gridfs-promise");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const URI = `mongodb+srv://ritvik:${process.env.PASSWORD}@cluster0.aeiaykn.mongodb.net/?retryWrites=true&w=majority`;
const mongoOptions = {
  autoReconnect: true,
  useNewUrlParser: true
};
let gridFS = new GridFSPromise("test", URI, mongoOptions, "uploads");

const storage = new GridFsStorage({
  url: URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), function (req, res, next) {
  res.json({
    message: `${req.file.filename} Uploaded Successfully!`
  });
});

app.get("/files/:id", function (req, res, next) {
  const { id } = req.params;
  gridFS
    .getFileStream(id)
    .then((item) => {
      item
        .once("error", () => {
          return res.status(400).end();
        })
        .pipe(res);
    })
    .catch(() => res.status(500));
});

app.delete("/files/:id", (req, res) => {
  const { id } = req.params;
  gridFS.delete(id).then(() => {
    res.status(200).json({
      message: "Deleted Successfully"
    });
  });
});

app.listen(5000, () => console.log("Started Successfully!"));
