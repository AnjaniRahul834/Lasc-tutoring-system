const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files from the public directory
app.use(express.static('tutor'));

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

// Handle POST requests to the /upload endpoint
app.post('/upload', upload.single('recording'), (req, res) => {
  const { originalname, path } = req.file;
  
  // Read the file from the local directory
  const fileData = fs.readFileSync(path);
  
  // Insert the file data into the recordings table
  const query = 'INSERT INTO recordings (name, data) VALUES (?, ?)';
  connection.query(query, [originalname, fileData], (err, results) => {
    if (err) {
      console.error('Error inserting file into database: ', err.stack);
      res.status(500).send('Error inserting file into database');
    } else {
      console.log('File inserted into database with ID: ', results.insertId);
      res.status(200).send('File uploaded successfully');
    }
  });
});

// Set up a route for the root URL
app.get('/', (req, res) => {
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

// Create a server instance
const server = http.createServer(app);

// Start listening on the specified port
const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
