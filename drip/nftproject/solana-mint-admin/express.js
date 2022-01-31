const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const cors = require('cors');
const parse = require('csv-parse');
const yauzl = require('yauzl');
const { spawn } = require('child_process');
const { Connection } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const app = express()
const expressjwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const port = 4000
const prisma = new PrismaClient()
app.use(express.json());
app.use(fileUpload());
app.use(cors({credentials:true, origin:["http://localhost:3000","http://localhost:3001","http://solnftart-admin.winitsoftware.com","https://solnftart-user.winitsoftware.com"]}))
//app.use(expressjwt({ secret: "KLZEXZOPCPLVMFSTOBDTPKJJ", algorithms: ['HS256']}).unless({path: ['/login','/register']}));

const largeNum = (name) => {
    if(fs.existsSync('static/'+name)) {
        return fs.readdirSync("static/"+name).filter((i)=>i.includes(".json")).length;
    } else {
        fs.mkdirSync('static/'+name);
        return 0;
    }
}

let progress = 0;
let assets = 0;
let laststep =  false;


app.use(express.static("static"));
app.post('/upload/:name', (req,res) => {
    if(req.files.image)
       req.files.image.mv(`static/${req.params.name}/${largeNum(req.params.name)}.png`);
    if(req.files.metadata) {
       let config = undefined;
       try {
        config = require('./static/'+req.params.name+'.info');
       } catch(e) {

       }
       req.files.metadata.mv(`static/${req.params.name}/${largeNum(req.params.name)}.json`);
    }
    let images = [];
    let jsons = [];
    let records = 0;
    let random = [];
    if(req.files.csvmetadata) {
        
        req.body.properties = JSON.parse(req.body.properties);
        if(!fs.existsSync('static/'+req.params.name))
            fs.mkdirSync('static/'+req.params.name);
        fs.writeFileSync('static/'+req.params.name+".info",JSON.stringify({"name":req.body.collection_name,"properties":req.body.properties,"family":req.body.collection_family,"seller_fee_basis_points":parseInt(req.body.royalty),"mint_keys":[],"airdrops":[],"stake":false,"reward":""}))
        var parser = parse({delimiter:','});
        parser.on('error',function(error) {
            console.log(error);
        })
        parser.on('end',function(err){
            function shuffle(array) {
                let currentIndex = array.length,  randomIndex;
              
                // While there remain elements to shuffle...
                while (currentIndex != 0) {
              
                  // Pick a remaining element...
                  randomIndex = Math.floor(Math.random() * currentIndex);
                  currentIndex--;
              
                  // And swap it with the current element.
                  [array[currentIndex], array[randomIndex]] = [
                    array[randomIndex], array[currentIndex]];
                }
              
                return array;
            }
             
            records = parser.info.records - 1 ;
            random = shuffle([...Array(records).keys()])
            
            
            for(var i=0;i<random.length;i++) {
                jsons[i].replace("image.png",i+".png");
                fs.writeFileSync(`static/${req.params.name}/${i}.json`,jsons[i]);
            }
        });
        parser.on('readable', function(){
            let record
            let metadataContent =  {
                name: "",
                symbol: "",
                description: "",
                seller_fee_basis_points: parseInt(req.body.royalty),
                image: "image.png",
                animation_url: "",
                attributes: [],
                external_url: "",
                collection: {
                    name: req.body.collection_name,
                    family: req.body.collection_family
                },
                properties: {
                  files:[{
                    uri: "image.png",
                    type: "image/png"
                  }],
                  "category":"image",
                  creators:[{
                      address: "",
                      share: 100,
                      verified: false
                  }],
                },
              };
            let number = largeNum(req.params.name);
            let csvprops = [];
            let props = [];
            let header = [];
            while (record = parser.read()) {
                
                if(record[0].localeCompare("name") == 0) {
                    header = record;
                    props = record.slice(4).filter((i)=>req.body.properties.includes(i));
                    continue;
                }
                images.push(record[3]);
                metadataContent.name = record[0];
                metadataContent.symbol = record[1];
                metadataContent.description = record[2];
                metadataContent.properties.creators[0].address = req.body.publickey;
                let attributes = [];
                let attr = 0;
                for (const i of props) {  
                    attributes.push({"trait_type":i,"value":record[header.indexOf(i)]})
                    attr = attr + 1;
                }
                metadataContent.attributes = attributes;
                
                jsons.push(JSON.stringify(metadataContent));
                number = number + 1;
            }
            parser.end()
        })
        parser.on('error', function(err){
            console.error(err.message)
        })
        parser.write(req.files.csvmetadata.data.toString());
    }
    if(req.files.imagezip) {
        let number = largeNum(req.params.name);
        let zipfiles = [];
        yauzl.fromBuffer(req.files.imagezip.data,{lazyEntries:true},function(err,zipfile) {
            if (err) throw err;
            zipfile.readEntry();
            zipfile.on('entry', function(entry) {
                //console.log(entry);
                
                zipfile.openReadStream(entry, function(err,readStream){
                    if (err) throw err;
                    var buffers = [];
                    readStream.on("data", function(data) {
                        buffers.push(data)
                    });
                    readStream.on("end", function() {
                        const buf = Buffer.concat(buffers);
                        zipfiles.push({name:entry.fileName,buf});
                        zipfile.readEntry();
                    });
                   
                })
            })

            zipfile.once('end', function(){
                
                for(var i=0;i<random.length;i++){ 
                    
                    let image = zipfiles.filter((f)=>f.name.localeCompare(images[random[i]])==0)
                    
                    if(image.length > 0)
                        fs.writeFileSync("static/"+req.params.name+"/"+i+".png",image[0].buf);
                }
            })
        })
    }
    res.sendStatus(200);
})

app.get('/totalnfts/:name', (req,res) => {
    res.send(""+(largeNum(req.params.name)));
})

app.get('/collections', (req,res) => {
    const data = fs.readdirSync("static/",{withFileTypes:true}).filter((i)=>i.name.includes(".info"));
    const names = [];
    for (const i of data) {
        const json = fs.readFileSync("static/"+i.name);
        const parsed = JSON.parse(json);
        console.log(parsed);
        names.push(parsed.name);
    }
    res.json(names);
})

app.get('/collection/:name', (req,res) => {
    let data = fs.readdirSync("static/"+req.params.name).filter((i)=>i.includes(".json"));
    res.send(data);
})

app.get('/getconfig/:name', (req,res)=>{
    const data = fs.readFileSync("static/"+req.params.name+".info");
    const json = JSON.parse(data.toString())
    res.json(json);
})

app.post('/candymachine/:name', (req,res)=>{
    const info = fs.readFileSync('static/'+req.params.name+'.info');
    const candymachineconfig = fs.readFileSync('candymachine.json');
    let candymachinejson = JSON.parse(candymachineconfig);

    let infojson = JSON.parse(info);
    if(infojson.candymachine)
        res.send("error");
    else
        res.send("success");
    infojson.candymachine = true;
    candymachinejson.goLiveDate = req.body.startdate;
    candymachinejson.price = parseFloat(req.body.price);
    candymachinejson.number = parseFloat(largeNum(req.params.name));
    assets = parseFloat(largeNum(req.params.name));
    fs.writeFileSync('static/'+req.params.name+'.info',JSON.stringify(infojson));
    fs.writeFileSync('candymachine.json',JSON.stringify(candymachinejson));
    //grep candymachine  | grep -oP "candy machine pubkey: [a-zA-Z0-9]+"
    const candymachine = spawn("sh",["script.sh", req.params.name])
    
    candymachine.stdout.on('data', function(data) {
        progress = progress + 1;
        laststep = data.includes("ended at")
        console.log("Child data: " + data);
    });

    candymachine.on('error', function(err){
        console.log(err);
    });
    candymachine.on('exit', function(code) {
        progress = 0;
        assets = 0;
    })
})

app.get('/candymachine/progress',  (req,res)=>{
    if(laststep) {
        res.send("100");
        laststep = false;
    }
    res.send(""+progress/(13+assets)*100)
})

app.get('/candymachineconfig/:name',  async (req,res)=>{
    try {
    const json = JSON.parse(fs.readFileSync('.cache/devnet-'+req.params.name+".json").toString());
    res.json(json);
    } catch(e) {
        res.send("Not minted");
    }
})

// app.get('/publickey/:name', async (req,res)=>{
//     const keypair = Keypair.fromSecretKey(
//         new Uint8Array(require('./'+req.params.name+".json"))
//     )

//     res.send(keypair.publicKey.toString());
// })

app.post('/login', async (req,res)=>{
    const password = crypto.createHash('md5').update(req.body.password).digest('hex');
    const user = await prisma.user.findFirst({where:{email:req.body.email,password}});
    if(user!= null) {
        const token = jwt.sign({email:req.body.email,password},"KLZEXZOPCPLVMFSTOBDTPKJJ")
        res.send({error:"Success",token});
    } else
        res.send({error:"Error"});
})

app.get('/logout', async (req,res)=>{
    
})

app.post('/mint/:name', (req,res) =>{
    const config = fs.readFileSync('static/'+req.params.name+'.info');
    const json = JSON.parse(config);
    json.mint_keys.push(req.body.pubkey);
    fs.writeFileSync('static/'+req.params.name+'.info',JSON.stringify(json));
});

app.get('/mint/:name', (req,res)=>{
    const config = require('./static/'+req.params.name+'.info');
    res.json(config.mint_keys);
})



app.post('/register',async (req,res)=>{
    const password = crypto.createHash('md5').update(req.body.password).digest('hex');
    let user = undefined;
    try {
        user = await prisma.user.create({data:{
            email:req.body.email,
            password
        }});
    } catch(e){
        res.send("Error");
    }
    if(user!=null)
        res.send("Success");
})

app.post('/coins',async (req,res)=>{
    let data = undefined;
    try {
        data = await prisma.coin.create({data:{
            name:req.body.name,
            symbol:req.body.symbol,
            supply:req.body.supply,
            token:req.body.token,
            decimals:req.body.decimals,
        }})
    } catch(e) {
        console.log(e);
        res.send("Error");
        return;
    }
    res.send("Success");
})

app.get('/coins',async (req,res)=>{
    let data = undefined;
    BigInt.prototype.toJSON = function() {       
        return this.toString()
    }
    try {
        data = await prisma.coin.findMany();
    } catch(e) {
        console.log(e);
        res.send("Error");
        return;
    }
    res.json(data);
})

app.post('/airdrop/save/:name',(req,res)=>{
    const config = fs.readFileSync('static/'+req.params.name+'.info');
    const json = JSON.parse(config);
    json.airdrops.push(req.body.tx);
    fs.writeFileSync('static/'+req.params.name+'.info',JSON.stringify(json));    
})

app.post('/airdrop/schedule', (req,res)=>{
    const job = schedule.scheduleJob("0 0 * * 1,4", async function (){
        let connection = new Connection("https://api.devnet.solana.com");
        tx.recentBlockhash = (await connection.getRecentBlockhash('recent')).blockhash;
        connection.sendTransaction(req.body.transaction);
    })
})

app.get('/stakeidl',(req,res)=>{
    const idl = fs.readFileSync('src/solnftstake.json');
    const json = JSON.parse(idl);
    res.json(json);
})

app.post('/stake/:name',(req,res)=>{
    const config = fs.readFileSync('static/'+req.params.name+'.info');
    const json = JSON.parse(config);
    json.stake = true;
    json.reward = req.body.reward;
    fs.writeFileSync('static/'+req.params.name+'.info',JSON.stringify(json));    
})

app.post('/collections/reward', (req,res)=>{
    const data = fs.readdirSync("static/",{withFileTypes:true}).filter((i)=>i.name.includes(".info"));
    const names = [];
    for (const i of data) {
        const json = fs.readFileSync("static/"+i.name);
        const parsed = JSON.parse(json);
        if(parsed.stake) {
            console.log(parsed);
            names.push(parsed.name);
        }
    }
    res.json(names);
})

app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


