// use std::collections::HashMap;
// // const myVal: i128 = 121;
// fn main() {
//     // Defining the Hash Map to insert static participation Keys
//     let mut partKey = HashMap::new();
//     let isKeyExpired: bool = false;
//     //Add Values 
//     partKey.insert(
//         "Participation Key for User1", 1214534236
//     );
//     partKey.insert(
//         "Participation Key for User2", 545234463
//         );
//     partKey.insert(
//             "Participation Key for User3", 876634544
//             );
            
//     partKey.insert(
//             "Participation Key for User4", 956545534
//             );
            
//     partKey.insert(
//             "Participation Key for User5", 125534234
//             );
            
//     partKey.insert(
//             "Participation Key for User6", 785663452
//             );
            
            
//     //Getting the total number of participation keys
//     println!("Total participation keys {}",partKey.len());
//     //Getting the participation key of single users(who requested to get his participation)
//    match partKey.get("Participation Key for User1"){
//        Some(partkey) => println!("Your participation Key: {}", partkey),
//        None => println!("Oops.! your participation key was not found, Either is is expired or not geenerated"),
    
//     }
//     //removing Outdated or Expired Participation Key
//     if(isKeyExpired == true)
//     { 
//         partKey.remove("Participation Key for User3");
//     }
   
//     //Loop through the partKey HashMap to get the list of all participation keys
//     for(key, value) in &partKey {
//     println!("{} : {}", key, value);
// }
// }

// type LockID = u64;
// static currID:LockID = 1;

// use std::collections::HashMap;
// // static part_record:ParticipationRecord
// fn main() {
//     let mut record:HashMap<i32, i32>;
//     Insert(record);
// }
// struct ParticipationDB{
//         res:i32
// }

// struct ParticipationRecord{
//     res:i32
// }

// fn Insert(mut arr: HashMap<i32, i32>){
    
// }   
// fn GetAll(arr:vec![ParticipationRecord]){
//    // arr.len();
//     let value=0;
//     let arrlength = arr.len();
//     // value = ParticipationDB{res:1};
//     for x in arr.iter() {
//         // value = x;
//         println!("User: {:?}", x);
        
//     }
// }

// [bip39-standard]: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki

// use bip39::{Mnemonic, MnemonicType, Language, Seed};
// use std::collections::HashMap;
// use std::time::{Duration, Instant};
// use std::{time ,thread};
// use std::thread::sleep;
// use rusqlite::{params, Connection, Result};

// #[derive(Debug)]
// struct Details {
//     pubkey: String,
//     partkey: i32,
// }
// fn registerPartKey(h: &mut HashMap<&str, &str> ,conn:Connection) -> Result<()>{
//     //let i:i32 = 5;
//     //let j:i32 = 6;
//     h.insert("1","value1");
//     h.insert("2","value2");
//     h.insert("3","value3");
//     h.insert("4","value4");
//     h.insert("5","value5");
//     h.insert("6","value6");
//     h.insert("7","value7");
//     for (key, value) in h {
//         conn.execute(
//             "INSERT INTO partKeys (userPubKey, userPartKey) VALUES (?1, ?2)",
//             params![key as &str, value as &str],
//         )?;
//     }
//     Ok(())
// }


// fn getPartKey(h: &mut HashMap<&str ,&str> ,conn:Connection) -> Result <()>
// {
//     let mut stmt = conn.prepare("SELECT userPubKey, userPartKey FROM partKeys")?;

//     let person_iter = stmt.query_map([], |row| {
//         Ok(Details {
//             pubkey: row.get(0)?,
//             partkey: row.get(1)?,
//         })
//     })?;

//     for person in person_iter {
//         println!("{:?}", person.unwrap());
//     }

//     Ok(())
// }

// fn checkForPartKeys(h: &mut HashMap<&str ,&str>)
// {
//     for(key, value) in h {
//         thread::sleep(time::Duration::from_secs(5));
//         println!("{} : {}", key, value);
//     }
//     println!("checking Done");
// }
// fn generatePart(){
//     // create a new randomly generated mnemonic phrase
// let mnemonic = Mnemonic::new(MnemonicType::Words12, Language::English);

// // get the phrase
// let phrase: &str = mnemonic.phrase();
// println!("phrase: {}", phrase);

// // get the HD wallet seed
// let seed = Seed::new(&mnemonic, "");

// // get the HD wallet seed as raw bytes
// let seed_bytes: &[u8] = seed.as_bytes();

// // print the HD wallet seed as a hex string
// println!("{:X}", seed);
// }
// fn main() -> Result<()> {
            
//     let mut h = HashMap::new();
//     let conn = Connection::open_in_memory()?;

//     conn.execute(
//         "CREATE TABLE partKeys ( userPubKey TEXT PRIMARY KEY, userPartKey INTEGER NOT NULL )",
//         [],
//     )?;

//     registerPartKey(&mut h ,conn);
//     // getPartKey(&mut h, conn);
//     // checkForPartKeys(&mut h);
//     generatePart();
//     Ok(())
// }


// use std::collections::HashMap;

// #[derive(Clone)] // we'll be cloning it later on
// struct Register<'a> {
//     data: &'a i32 
// }


// struct Test<'a> {
//     hash_map: HashMap<&'a str, Register<'a>>  // the hash map owns the struct
// }

// impl<'a> Test<'a> {
//     fn new() -> Test<'a> {
//         Test {hash_map: HashMap::new()}
//     }

//     fn insert(
//         &mut self, // must be mutable
//         register: Register<'a>) { // do not pass a reference
//         self.hash_map.insert("test", register);  // inserting moves `register`
//     }

//     fn getPartKey(obj:Test) {
//        // let mut test = Test::new();
//        // return *test.hash_map["test"].data;
//         }
// }

// fn main() {
//     let stuff = Register {data: &12};
//     let mut test = Test::new();

//     test.insert(stuff.clone());  // if we don't clone, `stuff` will get moved
//     test.getPartKey(test);
//     println!("{}", *test.hash_map["test"].data);  // outputs "12"
// }


// use rusqlite::{params, Connection, Result};
// use bip39::{Mnemonic, MnemonicType, Language, Seed};
// use std::collections::HashMap;

// #[derive(Debug)]

// struct Details {
//     pubkey: String,
//     partkey: i32,
// }

// fn main() -> Result<()> {
//     // Defining the Hash Map to insert static participation Keys

//     let mut partKey = HashMap::new();
//     let conn = Connection::open_in_memory()?;

//     let mnemonic = Mnemonic::new(MnemonicType::Words12, Language::English);
//     let phrase: &str = mnemonic.phrase();
//     println!("phrase: {}", phrase);
//     let seed = Seed::new(&mnemonic, "");
//     let seed_bytes: &[u8] = seed.as_bytes();
//     println!("{:X}", seed);

//     //Add Values
//     // partKey.insert("Participation Key for User1",seed);

//     conn.execute(
//         "CREATE TABLE partKeys ( userPartKey BLOB NOT NULL )",
//         [],
//     )?;

//         conn.execute(
//             "INSERT INTO partKeys (userPubKey) VALUES (?1)",
//             [seed],
//         )?;
    

//     let mut stmt = conn.prepare("SELECT userPubKey, userPartKey FROM partKeys")?;

//     let person_iter = stmt.query_map([], |row| {
//         Ok(Details {
//             pubkey: row.get(0)?,

//             partkey: row.get(1)?,
//         })
//     })?;

//     for person in person_iter {
//         println!("{:?}", person.unwrap());
//     }

//     Ok(())
// }
// use{
//     bip39::{Language, Mnemonic, MnemonicType, Seed}
// };
// fn main(){

//     let word_count = value_t!(matches.value_of(WORD_COUNT_ARG.name), usize).unwrap();
//             let mnemonic_type = MnemonicType::for_word_count(word_count)?;
//             let language = acquire_language(matches);

//             let silent = matches.is_present("silent");
//             if !silent {
//                 println!("Generating a new keypair");
//             }
//             let mnemonic = Mnemonic::new(mnemonic_type, language);
//             let (passphrase, passphrase_message) = acquire_passphrase_and_message(matches).unwrap();

//             let seed = Seed::new(&mnemonic, &passphrase);
//             let keypair = keypair_from_seed(seed.as_bytes())?;  

// }

// [bip39-standard]: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki


// [bip39-standard]: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
use bip32::{Mnemonic, Prefix, XPrv};
use rand_core::OsRng;
//use bs58::{encode};
use hex::{encode, decode};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use std::{time ,thread};
use std::thread::sleep;
use rusqlite::{params, Connection, Result};
use rusqlite::NO_PARAMS;


#[derive(Debug)]
struct VRFSecrets {
    pubkeybytes: [u8; 33],
    pubkey : String,
    prvkey : String,
}

#[derive(Debug)]
struct Demo{
    private: [u8; 3],
}   

impl Demo{

    fn convert(&mut self) {
         self.private  = [1,2,3];
    }
}

    fn generateVRFSecrets() -> Result<(),bip32::Error>{

    // create a new randomly generated mnemonic phrase, Public Key and private Key
    let mnemonic = Mnemonic::random(&mut OsRng, Default::default());
    let seed = mnemonic.to_seed("password");
    let root_xprv = XPrv::new(&seed)?;
    let child_path = "m/0/2147483647'/1/2147483646'";
    let child_xprv = XPrv::derive_from_path(&seed, &child_path.parse()?)?;

    //The Private key 
    let child_xprv_privatekey = child_xprv.private_key();
    let child_xprv_prvkey = child_xprv_privatekey.to_bytes();
    println!("Private Key :{:?}", child_xprv_prvkey);
    //Encoding the private key
    let encodeVal =   encode(child_xprv_prvkey);
    
    
    //The Public Key
    let child_xpub_publicKey = child_xprv.public_key();
    let child_xpub_pubkey = child_xpub_publicKey.to_bytes();
    println!("Public Key :{:?}", child_xpub_pubkey);


    //Converting/Encoding the public Key to string
    let child_xpub_str = encode(child_xpub_pubkey);   


    //Inserting values to struct
    let secrets = VRFSecrets {
        pubkeybytes: child_xpub_pubkey,
        pubkey: child_xpub_str,
        prvkey : encodeVal,
    };
   
    fn print_type_of<T>(_: &T) {
        println!("The Type of Keys: {}", std::any::type_name::<T>())
    }
    print_type_of(&child_xprv_prvkey);
    print_type_of(&child_xpub_pubkey);



    println!("{:?}", secrets);
    
    let decodeval = decode(secrets.prvkey).unwrap();
    println!("The Decoded Value of PRVKEY is: {:?}", decodeval);
    Ok(())
    
}

fn main(){
    generateVRFSecrets();
  
}