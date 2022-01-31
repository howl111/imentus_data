// [bip39-standard]: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
use bip32::{Mnemonic, XPrv};
// use rand_core::OsRng;
use std::{time ,thread};
use rusqlite::{params, Connection, Result ,NO_PARAMS};
use uuid::Uuid;
// use bs58::{encode};      
use hex::{encode, decode};
use ring_compat::signature::{
    ed25519::{Signature, SigningKey, VerifyingKey},
};
use ed25519::signature::{Signer, Verifier};
use rand_core::{OsRng, RngCore}; // Requires the `std` feature of `rand_core`

#[derive(Debug)]
struct Participation {
    uuid: String,
    pubkey: String,
    partkey: String,
    firstround: i64,
    lastround: i64,
}

#[derive(Debug)]
struct VRFSecrets {
    pubkey : String,
    privkey : String,
}

pub struct HelloSigner<S>
where
    S: Signer<ed25519::Signature>
{
    pub signing_key: S
}

impl<S> HelloSigner<S>
where
    S: Signer<ed25519::Signature>
{
    pub fn sign(&self, person: &str) -> ed25519::Signature {
        // NOTE: use `try_sign` if you'd like to be able to handle
        // errors from external signing services/devices (e.g. HSM/KMS)
        // <https://docs.rs/signature/latest/signature/trait.Signer.html#tymethod.try_sign>
        self.signing_key.sign(format_message(person).as_bytes())
    }
}

pub struct HelloVerifier<V> {
    pub verify_key: V
}

impl<V> HelloVerifier<V>
where
    V: Verifier<ed25519::Signature>
{
    pub fn verify(
        &self,
        person: &str,
        signature: &ed25519::Signature
    ) -> Result<(), ed25519::Error> {
        self.verify_key.verify(format_message(person).as_bytes(), signature)
    }
}

fn format_message(person: &str) -> String {
    format!("Hello, {}!", person)
}

fn registerPartKey(value:String, left:&[u8]) -> Result<()>{
    let conn = Connection::open("partkeyDB.db")?;  
    let uuid = Uuid::from_slice(&left).unwrap();
    conn.execute(
            "INSERT INTO partKeys (uuid ,userPubKey, userPartKey ,firstround ,lastround) VALUES (?1, ?2 ,?3 ,?4 ,?5)",
            params![uuid.to_string() ,value ,"1" ,0 , 0],
        )?;
        println!("Participation Key is generated : {}",value);
    Ok(())
}

fn removePartKey(value:String) -> Result<()> {
    let conn = Connection::open("partkeyDB.db")?;
    conn.execute(
        "DELETE FROM partKeys WHERE userPartKey IN (?1)",params!["1"]
        
    )?;
    Ok(())
}

fn getPartKey(uuid:String) -> Result <()>
{
    let conn = Connection::open("partkeyDB.db")?;
    let mut stmt = conn.prepare("SELECT uuid ,userPubKey, userPartKey ,firstround ,lastround FROM partKeys WHERE uuid=:uuid;")?;
    let person_iter = stmt.query_map(&[(":uuid",uuid.to_string().as_str())], |row| {
        Ok(Participation {
            uuid: row.get(0)?,
            pubkey: row.get(1)?,
            partkey: row.get(2)?,
            firstround: row.get(3)?,
            lastround: row.get(4)?,
        })
    })?;
    for person in person_iter {
        println!("{:?}", person.unwrap());
    }
    Ok(())
}

fn checkForPartKeys() -> Result<()>{
    let conn = Connection::open("partkeyDB.db")?;
    let mut stmt = conn.prepare("SELECT uuid, userPubKey, userPartKey FROM partKeys")?;

    let person_iter = stmt.query_map([], |row| {
        Ok(Participation {
            uuid: row.get(0)?,
            pubkey: row.get(1)?,
            partkey: row.get(2)?,
            firstround: row.get(3)?,
            lastround: row.get(4)?,
        })
    })?;

    for person in person_iter {
        thread::sleep(time::Duration::from_secs(5));
        println!("{:?}", person.unwrap());
    }
    println!("checking Done");
    Ok(())
}

fn demo() -> Result<HelloVerifier<ring_compat::signature::ed25519::VerifyingKey>, ()>{

    /// `HelloSigner` defined above instantiated with *ring* as
    /// the signing provider.
    pub type RingHelloSigner = HelloSigner<SigningKey>;
    
    let mut ed25519_seed = [0u8; 32];
    OsRng.fill_bytes(&mut ed25519_seed);
    
    let signing_key = SigningKey::from_seed(&ed25519_seed).unwrap();
    let verify_key = signing_key.verify_key();
    
    let signer = RingHelloSigner { signing_key };
    let person = "Joe"; // Message to sign
    let signature = signer.sign(person);
    
    /// `HelloVerifier` defined above instantiated with *ring*
    /// as the signature verification provider.
    pub type RingHelloVerifier = HelloVerifier<VerifyingKey>;
    
    let verifier = RingHelloVerifier { verify_key };
    println!("{:?}",signing_key);
    assert!(verifier.verify(person, &signature).is_ok());
    Ok(verifier)
}

fn generatePart() -> Result<(),bip32::Error>{

    let mnemonic = Mnemonic::random(&mut OsRng, Default::default());
    let seed = mnemonic.to_seed("password");
    let child_path = "m/0/2147483647'/1/2147483646'";
    let child_xprv = XPrv::derive_from_path(&seed, &child_path.parse()?)?;
    let child_private = child_xprv.private_key();
    let byte_privkey = child_private.to_bytes();
    let child_public = child_xprv.public_key();
    let child_pubkey = child_public.to_bytes();
    Ok(())
}   

fn GenerateVRFSecrets() -> Result<VRFSecrets,bip32::Error>{

    let mnemonic = Mnemonic::random(&mut OsRng, Default::default());
    let seed = mnemonic.to_seed("password");
    let child_path = "m/0/2147483647'/1/2147483646'";
    let child_xprv = XPrv::derive_from_path(&seed, &child_path.parse()?)?;
    let child_private = child_xprv.private_key();
    let byte_privkey = child_private.to_bytes();
    let child_public = child_xprv.public_key();
    let child_pubkey = child_public.to_bytes();
    let pubkey = encode(child_pubkey);
    let privkey = encode(byte_privkey);
    let secrets = VRFSecrets{
        pubkey: pubkey,
        privkey: privkey,
    };
    Ok(secrets)
}

fn Hash()-> Result<(),bip32::Error>{
    let mnemonic = Mnemonic::random(&mut OsRng, Default::default());
    let seed = mnemonic.to_seed("password");
    let child_path = "m/0/2147483647'/1/2147483646'";
    let child_xprv = XPrv::derive_from_path(&seed, &child_path.parse()?)?;
    let child_private = child_xprv.private_key();
    let byte_privkey = child_private.to_bytes();
    let child_public = child_xprv.public_key();
    let child_pubkey = child_public.to_bytes();
    let mut pubkey = encode(child_pubkey);
    let privkey = encode(byte_privkey);
    let s3 = format!("{}{}", pubkey, privkey);
  
    // let hash = decode(s3);
    println!("{:?}",s3);
    Ok(())
}
fn main() -> Result<()> {
            
    let conn = Connection::open("partkeyDB.db")?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS partKeys (uuid TEXT ,userPubKey TEXT , userPartKey TEXT ,firstround INTEGER ,lastround INTEGER)",
        NO_PARAMS,
    )?;
    let para = String::from("96a231d1-b02f-b803-5217-1f2bc1940069");
    //registerPartKey(conn);
    //getPartKey(para);
    //checkForPartKeys();
    //  generatePart();
    // removePartKey(para);
    demo();
    // Hash();
    //println!("COMPILED: {}", compiled);
    Ok(())
}
