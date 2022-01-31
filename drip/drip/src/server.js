const express = require('express');
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { Console } = require('console');
const app = express();
const port = process.env.PORT || 8080;


app.use(cors({credentials:true, origin:["http://localhost:3000"]}));
app.use(fileUpload());
// sendFile will go here
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.post('/upload',(req, res) => {

    console.log(req.files);
    
    if(req.files){
        console.log("API working");
        console.log(req.file)
    }
    else{
        console.log("file not found")
    }
})

app.listen(port);
console.log('Server started at http://localhost:' + port);