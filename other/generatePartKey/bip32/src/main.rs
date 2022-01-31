use bip32::{Mnemonic, Prefix, XPrv};
use bs58::{encode};
use rand_core::OsRng;
fn main() -> Result<(),bip32::Error>{
    let mnemonic = Mnemonic::random(&mut OsRng, Default::default());
    let seed = mnemonic.to_seed("password");
    let root_xprv = XPrv::new(&seed)?;
    let child_path = "m/0/2147483647'/1/2147483646'";
    let child_xprv = XPrv::derive_from_path(&seed, &child_path.parse()?)?;
    let child_xpub = child_xprv.to_bytes();
    let child_xpub_str = encode(child_xpub);
    println!("{:?}",child_xpub_str);
    Ok(())
}
