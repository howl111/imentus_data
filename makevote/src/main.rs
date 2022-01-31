use rand::Rng;


struct MakeProposal {
    acountFirst: u32,
    acountSecond: u32,
    acountThird: u32,
    acountFourth: u32,
    acountFifth: u32,
    acountSixth: u32,
    acountSeventh: u32,
    acountEight: u32,
    acountNinth: u32,
    acountTenth: u32,
    roundFirst:u32,
    roundLast:u32,
    partkey: String,
}

fn generateRandom()-> u8{ 
    let mut rng = rand::thread_rng();
    let n1: u8 = rng.gen();
    return n1;
}

fn makeProposal() {
    let myRandoness = generateRandom();
    if(myRandoness>1 && myRandoness <=100) {
        println!("Welcome to the node");
    }
    else{
        println!("Sorry you can't vote");
    }
}
fn main() {
    let my_val = generateRandom();
    println!("Random Number{}", my_val);
    makeProposal();
  
}
    
