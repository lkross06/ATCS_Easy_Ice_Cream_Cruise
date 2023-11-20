const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Configure the body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the login page at the root path ('/')
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html'));
});

// Create a route to handle the form submission
app.post('/submitlogin', (req, res) => {
    // Retrieve the form data from the request body
    const { username, password } = req.body;

    // Perform any necessary validation or processing on the form data

    // Respond to the client with a JSON response
    res.json({
        status: 'success',
        data: {
            username: username,
            password: password
        }
    });
});

app.get("/public/game.html", (req, res) =>{
    res.sendFile(path.join(__dirname, '/public/game.html'));
});

// Start the Express server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});