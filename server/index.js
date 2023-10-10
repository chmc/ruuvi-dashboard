const express = require('express'); 
const app = express(); 
const port = process.env.PORT || 3001; 

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); 

// create a GET route
app.get('/api/express_backend', (req, res) => { 
    console.log('api call received')
    res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }); //Line 10
}); 