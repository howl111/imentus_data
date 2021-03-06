#![feature(test)]

extern crate test;

use analog_perf::{packet::PacketsRecycler, recycler::Recycler};

use test::Bencher;

#[bench]
fn bench_recycler(bencher: &mut Bencher) {
    analog_logger::setup();

    let recycler: PacketsRecycler = Recycler::default();

    for _ in 0..1000 {
        let _packet = recycler.allocate("");
    }

    bencher.iter(move || {
        let _packet = recycler.allocate("");
    });
}
