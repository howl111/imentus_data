import { Connection, Keypair } from "@solana/web3.js";
import { TestUtils, toBase58, toBN, toPublicKeys } from "../tests/utils";
import fs from "fs";
import path from "path";
import * as anchor from "@project-serum/anchor";
import { JetUtils, ReserveAccounts, ReserveConfig } from "../tests/utils/jet";
import { assert } from "chai";
import { DEX_ID, SerumUtils } from "../tests/utils/serum";
import { BN } from "@project-serum/anchor";

const main = async () => {
  console.log("Migrating...");
  let cluster = "https://api.devnet.solana.com";
  const connection = new Connection(cluster, anchor.Provider.defaultOptions().commitment);
  if (connection){
    console.log("Connection Established")
  }
  const wallet = anchor.Wallet.local();
  console.log("Wallet: ", wallet.payer.publicKey.toBase58())
  let provider = new anchor.Provider(connection, wallet, anchor.Provider.defaultOptions());
  anchor.setProvider(provider);

  // add pubkeys to the idl
  const idlPath = path.resolve("/home/imentus/iM-Projects/jet-protocol-dev/target/idl/jet.json");
  const idlWebPath = path.resolve("/home/imentus/iM-Projects/jet-protocol-dev/app/public/idl/devnet/jet.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8")) as any;

  const program = new anchor.Program(idl, idl.metadata.address);
  const utils = new TestUtils(provider.connection, wallet);
  const jetUtils = new JetUtils(provider.connection, wallet, program, false);
  const serumUtils = new SerumUtils(utils, false);

  const market: Keypair = Keypair.generate();

  // let marketkey = Uint8Array.from([201,36,7,2,150,106,219,164,199,240,126,83,199,210,197,230,123,60,206,8,191,208,9,149,227,3,109,44,175,214,114,245,78,147,201,130,45,198,20,204,92,160,82,61,165,207,105,98,246,143,173,235,123,253,21,170,241,66,213,119,62,96,105,211]);
  // const market = Keypair.fromSecretKey(marketkey);
  console.log("Market Keypair: ", market.publicKey.toBase58())

  let [marketAuthority] = await jetUtils.findMarketAuthorityAddress(market.publicKey);
  console.log("marketAuthority Keypair: ", marketAuthority.toBase58())

  const marketOwner = wallet.publicKey;
  console.log("marketOwner Keypair: ", marketOwner.toBase58())


  console.log("################  Creating mints and pyth accounts...  ################");

  const usdcPythPrice = await utils.pyth.createPriceAccount();
  console.log("1. usdcPythPrice: ", usdcPythPrice.publicKey.toBase58());
  const usdcPythProduct = await utils.pyth.createProductAccount();
  console.log("2. usdcPythProduct: ", usdcPythProduct.publicKey.toBase58());
  const usdcMint = await utils.createToken(6);
  console.log("3. usdcMint: ", usdcMint.publicKey.toBase58());
  const wsolPythPrice = await utils.pyth.createPriceAccount();
  console.log("4. wsolPythPrice: ", wsolPythPrice.publicKey.toBase58());
  const wsolPythProduct = await utils.pyth.createProductAccount();
  console.log("5. wsolPythProduct: ", wsolPythProduct.publicKey.toBase58());
  const wsolMint = await utils.createNativeToken();
  console.log("6. wsolMint: ", wsolMint.publicKey.toBase58());
  const btcPythPrice = await utils.pyth.createPriceAccount();
  console.log("7. btcPythPrice: ", btcPythPrice.publicKey.toBase58());
  const btcPythProduct = await utils.pyth.createProductAccount();
  console.log("8. btcPythProduct: ", btcPythProduct.publicKey.toBase58());
  const btcMint = await utils.createToken(6);
  console.log("9. btcMint: ", btcMint.publicKey.toBase58());
  const ethPythPrice = await utils.pyth.createPriceAccount();
  console.log("10. ethPythPrice: ", ethPythPrice.publicKey.toBase58());
  const ethPythProduct = await utils.pyth.createProductAccount();
  console.log("11. ethPythProduct: ", ethPythProduct.publicKey.toBase58());
  const ethMint = await utils.createToken(6);
  console.log("12. ethMint: ", ethMint.publicKey.toBase58());
  const quoteTokenMint = usdcMint.publicKey;
  console.log("13. quoteTokenMint: ", quoteTokenMint.toBase58());

  console.log("################  Setting prices...  ################");
  await utils.pyth.updatePriceAccount(usdcPythPrice, {
    aggregatePriceInfo: {
      price: 1n,
    },
  });
  await utils.pyth.updateProductAccount(usdcPythProduct, {
    priceAccount: usdcPythPrice.publicKey,
    attributes: {
      quote_currency: "USD",
    },
  });
  await utils.pyth.updatePriceAccount(wsolPythPrice, {
    aggregatePriceInfo: {
      price: 71n,
    },
  });
  await utils.pyth.updateProductAccount(wsolPythProduct, {
    priceAccount: wsolPythPrice.publicKey,
    attributes: {
      quote_currency: "USD",
    },
  });
  await utils.pyth.updatePriceAccount(btcPythPrice, {
    aggregatePriceInfo: {
      price: 72231n,
    },
  });
  await utils.pyth.updateProductAccount(btcPythProduct, {
    priceAccount: btcPythPrice.publicKey,
    attributes: {
      quote_currency: "USD",
    },
  });
  await utils.pyth.updatePriceAccount(ethPythPrice, {
    aggregatePriceInfo: {
      price: 2916n,
    },
  });
  await utils.pyth.updateProductAccount(ethPythProduct, {
    priceAccount: ethPythPrice.publicKey,
    attributes: {
      quote_currency: "USD",
    },
  });

  // Create dex markets
  const createMarketOpts = {
    baseLotSize: 100000,
    quoteLotSize: 100,
    feeRateBps: 22,
  };
  console.log("Initializing sol/usdc serum markets...")
  const wsolUsdcMarket = await serumUtils.createMarket({ ...createMarketOpts, baseToken: wsolMint, quoteToken: usdcMint });
  console.log("Initializing btc/usdc serum markets...")
  const btcUsdcMarket = await serumUtils.createMarket({ ...createMarketOpts, baseToken: btcMint, quoteToken: usdcMint });
  console.log("Initializing eth/usdc serum markets...")
  const ethUsdcMarket = await serumUtils.createMarket({ ...createMarketOpts, baseToken: ethMint, quoteToken: usdcMint });

  await program.rpc.initMarket(marketOwner, "USD", quoteTokenMint, {
    accounts: toPublicKeys({
      market,
    }),
    signers: [market],
    instructions: [
      await program.account.market.createInstruction(market),
    ],
  });

  const reserveConfig: ReserveConfig = {
    utilizationRate1: new BN(8500),
    utilizationRate2: new BN(9500),
    borrowRate0: new BN(50),
    borrowRate1: new BN(600),
    borrowRate2: new BN(4000),
    borrowRate3: new BN(1600),
    minCollateralRatio: new BN(12500),
    liquidationPremium: new BN(300),
    manageFeeRate: new BN(0),
    manageFeeCollectionThreshold: new BN(10),
    loanOriginationFee: new BN(0),
    liquidationSlippage: new BN(300),
    liquidationDexTradeMax: new BN(100),
  };

  let usdcReserveAccounts = await jetUtils.createReserveAccount(usdcMint, wsolUsdcMarket.publicKey, usdcPythPrice.publicKey, usdcPythProduct.publicKey);
  let wsolReserveAccounts = await jetUtils.createReserveAccount(wsolMint, wsolUsdcMarket.publicKey, wsolPythPrice.publicKey, wsolPythProduct.publicKey);
  let btcReserveAccounts = await jetUtils.createReserveAccount(btcMint, btcUsdcMarket.publicKey, btcPythPrice.publicKey, btcPythProduct.publicKey);
  let ethReserveAccounts = await jetUtils.createReserveAccount(ethMint, ethUsdcMarket.publicKey, ethPythPrice.publicKey, ethPythProduct.publicKey);

  idl.metadata = {
    ...idl.metadata,
    serumProgramId: DEX_ID.toBase58(),
    cluster,
    market: {
      market: market.publicKey.toBase58(),
      marketAuthority: marketAuthority.toBase58(),
    },
    reserves: [
      reserveAccountsMetadata(usdcReserveAccounts, "USDC", "USDC", usdcMint.decimals, 0),
      reserveAccountsMetadata(wsolReserveAccounts, "Solana", "SOL", wsolMint.decimals, 1),
      reserveAccountsMetadata(btcReserveAccounts, "Bitcoin", "BTC", btcMint.decimals, 2),
      reserveAccountsMetadata(ethReserveAccounts, "Ether", "ETH", ethMint.decimals, 3),
    ]
  }

  for (let i = 0; i < idl.metadata.reserves.length; i++) {
    assert(i === idl.metadata.reserves[i].reserveIndex, "Reserve index does not match it's position in the array.");
  }

  console.log(`Writing reserve addresses to ${idlWebPath}...`);
  fs.mkdirSync(path.dirname(idlWebPath), { recursive: true })
  fs.writeFileSync(idlWebPath, JSON.stringify(idl, undefined, 2));

  console.log("Initializing usdc reserve...");
  await jetUtils.initReserve(usdcReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
  console.log("Initializing wsol reserve...");
  await jetUtils.initReserve(wsolReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
  console.log("Initializing btc reserve...");
  await jetUtils.initReserve(btcReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
  console.log("Initializing eth reserve...");
  await jetUtils.initReserve(ethReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
}

const reserveAccountsMetadata = (reserveAccounts: ReserveAccounts, name: string, abbrev: string, decimals: number, reserveIndex: number) => {
  return {
    ...reserveAccounts,
    name,
    abbrev,
    decimals,
    reserveIndex,
    accounts: toBase58({
      ...reserveAccounts.accounts,
      reserve: reserveAccounts.accounts.reserve.publicKey,
      tokenMint: reserveAccounts.accounts.tokenMint.publicKey,
      pythPrice: reserveAccounts.accounts.pythPrice,
      pythProduct: reserveAccounts.accounts.pythProduct,
      tokenSource: undefined, // users 'usdc' token account
      depositNoteDest: undefined, // users
    }),
    bump: {
      ...reserveAccounts.bump,
      depositNoteDest: undefined,
    }
  }
}
main();