const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const port = 3000;
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'tutor/recordings');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mySQL@123', 
  database: 'video_audio_recording'
});

// Test the database connection
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err.stack);
    return;
  }

  console.log('Connected to database as ID: ', connection.threadId);
});

// Handle POST requests to the /recordings endpoint
app.post('/recordings', upload.single('recording'), (req, res) => {
  const { originalname, filename } = req.file;

  // Insert the file data into the recordings table
  const query = 'INSERT INTO recordings (name, file_name) VALUES (?, ?)';
  connection.query(query, [originalname, filename], (err, results) => {
    if (err) {
      console.error('Error inserting file into database: ', err.stack);
      res.status(500).send('Error inserting file into database');
    } else {
      console.log('File inserted into database with ID: ', results.insertId);
      res.status(200).send('File uploaded successfully');
    }
  });
});



// Serve static files from the tutor directory
app.use(express.static('tutor'));
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './sign.html';
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
