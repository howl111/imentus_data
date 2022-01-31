// type participationDB struct {
// 	cache map[ParticipationID]ParticipationRecord

// 	// dirty marked on Record(), cleared on Register(), Delete(), Flush()
// 	dirty map[ParticipationID]struct{}

// 	log   logging.Logger
// 	store db.Pair
// 	mutex deadlock.RWMutex

// 	writeQueue     chan partDBWriteRecord
// 	writeQueueDone chan struct{}

// 	flushTimeout time.Duration
// }

use rusqlite::{params, Connection, Result};

use std::collections::HashMap;

#[derive(Debug)]

struct Details {
    pubkey: String,

    partkey: i32,
}

fn main() -> Result<()> {
    // Defining the Hash Map to insert static participation Keys

    let mut partKey = HashMap::new();

    let conn = Connection::open_in_memory()?;

    //Add Values

    partKey.insert("Participation Key for User1", 1214534236);

    partKey.insert("Participation Key for User2", 545234463);

    partKey.insert("Participation Key for User3", 876634544);

    partKey.insert("Participation Key for User4", 956545534);

    partKey.insert("Participation Key for User5", 125534234);

    conn.execute(
        "CREATE TABLE partKeys ( userPubKey TEXT PRIMARY KEY, userPartKey INTEGER NOT NULL )",
        [],
    )?;

    for (key, value) in &partKey {
        conn.execute(
            "INSERT INTO partKeys (userPubKey, userPartKey) VALUES (?1, ?2)",
            params![key, value],
        )?;
    }

    let mut stmt = conn.prepare("SELECT userPubKey, userPartKey FROM partKeys")?;

    let person_iter = stmt.query_map([], |row| {
        Ok(Details {
            pubkey: row.get(0)?,

            partkey: row.get(1)?,
        })
    })?;

    for person in person_iter {
        println!("{:?}", person.unwrap());
    }

    Ok(())
}
