const express = require('express');
const app = express();
const server = require('http').createServer(app);
const fs = require('fs');

app.use(express.static('assets'));

app.get('/', function(req, res){
    fs.readFile('./assets/SmartEditor2.html', (err, data) => {
        if(err) throw err;

        res.writeHead(200, {
            'Content-Type' : 'text/html'
        })
        res.write(data)
        res.end();
    });
});

server.listen(8080, () => {
    console.log('실행');
});