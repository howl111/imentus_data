import Arweave from 'arweave';
import { mintNFT } from './mint';
import key from './arweavekey.json';
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

async function storeArweave(data,type) {
    let keys = await arweave.wallets.generate();
    let tx = await arweave.createTransaction({
        data
    }, key);
    tx.addTag('Content-Type', type);
    await arweave.transactions.sign(tx, key);
    let uploader = await arweave.transactions.getUploader(tx);
    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
    return tx.id;
}

export async function arweaveform(metadata,collection,current,pubkey,wallet) {
    try {
    let image = await fetch(process.env.REACT_APP_API_ENDPOINT+"/"+collection+"/"+current+".png");
    console.log(collection,current);
    let imageblob = await image.blob();
    let imagestream = await imageblob.arrayBuffer();
    //let uint8  = new Uint8Array(imagebuffer);
    //console.log(uint8);
    let txid = await storeArweave(imagestream,"image/png");
    metadata.image = `https://arweave.net/${txid}?ext=png`
    metadata.properties.files[0].uri = `https://arweave.net/${txid}?ext=png`
    txid = await storeArweave(JSON.stringify(metadata),"application/json");
    console.log(txid);
    
    mintNFT(metadata,`https://arweave.net/${txid}`,wallet);
    } catch(e) {
        alert("Error please try again")
    }
}

