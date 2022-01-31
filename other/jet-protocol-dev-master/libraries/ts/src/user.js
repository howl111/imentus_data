"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JetUser = exports.TokenAmount = void 0;
const web3_js_1 = require("@solana/web3.js");
const _1 = require(".");
const spl_token_1 = require("@solana/spl-token");
class TokenAmount {
    constructor(mint, amount) {
        this.mint = mint;
        this.amount = amount;
    }
}
exports.TokenAmount = TokenAmount;
class JetUser {
    constructor(client, market, address, obligation) {
        this.client = client;
        this.market = market;
        this.address = address;
        this.obligation = obligation;
        this._deposits = [];
        this._collateral = [];
        this._loans = [];
        this.conn = this.client.program.provider.connection;
    }
    static async load(client, market, address) {
        const obligationAccount = await client.findDerivedAccount([
            "obligation",
            market.address,
            address,
        ]);
        const user = new JetUser(client, market, address, obligationAccount);
        user.refresh();
        return user;
    }
    async liquidateDex(loanReserve, collateralReserve) {
        const tx = await this.makeLiquidateDexTx(loanReserve, collateralReserve);
        return await this.client.program.provider.send(tx);
    }
    async makeLiquidateDexTx(loanReserve, collateralReserve) {
        const loanDexAccounts = await loanReserve.loadDexMarketAccounts();
        const collateralDexAccounts = await collateralReserve.loadDexMarketAccounts();
        const loanAccounts = await this.findReserveAccounts(loanReserve);
        const collateralAccounts = await this.findReserveAccounts(collateralReserve);
        const tx = new web3_js_1.Transaction();
        tx.add(loanReserve.makeRefreshIx());
        tx.add(collateralReserve.makeRefreshIx());
        tx.add(this.client.program.instruction.liquidateDex({
            accounts: {
                sourceMarket: collateralDexAccounts,
                targetMarket: loanDexAccounts,
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                obligation: this.obligation.address,
                loanReserve: loanReserve.address,
                loanReserveVault: loanReserve.data.vault,
                loanNoteMint: loanReserve.data.loanNoteMint,
                loanAccount: loanAccounts.loan.address,
                collateralReserve: collateralReserve.address,
                collateralReserveVault: collateralReserve.data.vault,
                depositNoteMint: collateralReserve.data.depositNoteMint,
                collateralAccount: collateralAccounts.collateral.address,
                dexSwapTokens: loanReserve.data.dexSwapTokens,
                dexProgram: this.client.devnet ? _1.DEX_ID_DEVNET : _1.DEX_ID,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY
            },
        }));
        return tx;
    }
    async liquidate(loanReserve, collateralReserve, payerAccount, receiverAccount, amount) {
        const tx = await this.makeLiquidateTx(loanReserve, collateralReserve, payerAccount, receiverAccount, amount);
        return await this.client.program.provider.send(tx);
    }
    async makeLiquidateTx(_loanReserve, _collateralReserve, _payerAccount, _receiverAccount, _amount) {
        throw new Error("not yet implemented");
    }
    async repay(reserve, tokenAccount, amount) {
        const tx = await this.makeRepayTx(reserve, tokenAccount, amount);
        return await this.client.program.provider.send(tx);
    }
    async makeRepayTx(reserve, tokenAccount, amount) {
        const accounts = await this.findReserveAccounts(reserve);
        const tx = new web3_js_1.Transaction();
        tx.add(reserve.makeRefreshIx());
        tx.add(this.client.program.instruction.repay(amount, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                payer: this.address,
                reserve: reserve.address,
                vault: reserve.data.vault,
                obligation: this.obligation.address,
                loanNoteMint: reserve.data.loanNoteMint,
                loanAccount: accounts.loan.address,
                payerAccount: tokenAccount,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        }));
        return tx;
    }
    async withdrawCollateral(reserve, amount) {
        const tx = await this.makeWithdrawCollateralTx(reserve, amount);
        return await this.client.program.provider.send(tx);
    }
    async makeWithdrawCollateralTx(reserve, amount) {
        const accounts = await this.findReserveAccounts(reserve);
        const bumpSeeds = {
            collateralAccount: accounts.collateral.bumpSeed,
            depositAccount: accounts.deposits.bumpSeed,
        };
        const tx = new web3_js_1.Transaction();
        tx.add(reserve.makeRefreshIx());
        tx.add(this.client.program.instruction.withdrawCollateral(bumpSeeds, amount, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                owner: this.address,
                obligation: this.obligation.address,
                reserve: reserve.address,
                collateralAccount: accounts.collateral.address,
                depositAccount: accounts.deposits.address,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        }));
        return tx;
    }
    async withdraw(reserve, tokenAccount, amount) {
        const tx = await this.makeWithdrawTx(reserve, tokenAccount, amount);
        return await this.client.program.provider.send(tx);
    }
    async makeWithdrawTx(reserve, tokenAccount, amount) {
        const accounts = await this.findReserveAccounts(reserve);
        const tx = new web3_js_1.Transaction();
        tx.add(reserve.makeRefreshIx());
        tx.add(this.client.program.instruction.withdraw(accounts.deposits.bumpSeed, amount, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                withdrawAccount: tokenAccount,
                depositAccount: accounts.deposits.address,
                depositor: this.address,
                reserve: reserve.address,
                vault: reserve.data.vault,
                depositNoteMint: reserve.data.depositNoteMint,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        }));
        return tx;
    }
    async deposit(reserve, tokenAccount, amount) {
        const tx = await this.makeDepositTx(reserve, tokenAccount, amount);
        return await this.client.program.provider.send(tx);
    }
    async makeDepositTx(reserve, tokenAccount, amount) {
        const accounts = await this.findReserveAccounts(reserve);
        const depositAccountInfo = await this.conn.getAccountInfo(accounts.deposits.address);
        const tx = new web3_js_1.Transaction();
        if (depositAccountInfo == null) {
            tx.add(this.makeInitDepositAccountIx(reserve, accounts.deposits));
        }
        tx.add(reserve.makeRefreshIx());
        tx.add(this.client.program.instruction.deposit(accounts.deposits.bumpSeed, amount, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                depositSource: tokenAccount,
                depositAccount: accounts.deposits.address,
                depositor: this.address,
                reserve: reserve.address,
                vault: reserve.data.vault,
                depositNoteMint: reserve.data.depositNoteMint,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        }));
        return tx;
    }
    async depositCollateral(reserve, amount) {
        const tx = await this.makeDepositCollateralTx(reserve, amount);
        return await this.client.program.provider.send(tx);
    }
    async makeDepositCollateralTx(reserve, amount) {
        const accounts = await this.findReserveAccounts(reserve);
        const obligationAccountInfo = await this.conn.getAccountInfo(this.obligation.address);
        const collateralAccountInfo = await this.conn.getAccountInfo(accounts.collateral.address);
        const tx = new web3_js_1.Transaction();
        if (obligationAccountInfo == null) {
            tx.add(this.makeInitObligationAccountIx());
        }
        if (collateralAccountInfo == null) {
            tx.add(this.makeInitCollateralAccountIx(reserve, accounts.collateral));
        }
        const bumpSeeds = {
            depositAccount: accounts.deposits.bumpSeed,
            collateralAccount: accounts.collateral.bumpSeed,
        };
        tx.add(reserve.makeRefreshIx());
        tx.add(this.client.program.instruction.depositCollateral(bumpSeeds, amount, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                obligation: this.obligation.address,
                depositAccount: accounts.deposits.address,
                collateralAccount: accounts.collateral.address,
                owner: this.address,
                reserve: reserve.address,
                noteMint: reserve.data.depositNoteMint,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        }));
        return tx;
    }
    async borrow(reserve, receiver, amount) {
        const tx = await this.makeBorrowTx(reserve, receiver, amount);
        return await this.client.program.provider.send(tx);
    }
    async makeBorrowTx(reserve, receiver, amount) {
        const accounts = await this.findReserveAccounts(reserve);
        const loanAccountInfo = await this.conn.getAccountInfo(accounts.loan.address);
        const tx = new web3_js_1.Transaction();
        if (loanAccountInfo == null) {
            tx.add(this.makeInitLoanAccountIx(reserve, accounts.loan));
        }
        tx.add(reserve.makeRefreshIx());
        tx.add(this.client.program.instruction.borrow(accounts.loan.bumpSeed, amount, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                reserve: reserve.address,
                obligation: this.obligation.address,
                vault: reserve.data.vault,
                loanNoteMint: reserve.data.loanNoteMint,
                borrower: this.address,
                loanAccount: accounts.loan.address,
                receiverAccount: receiver,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        }));
        return tx;
    }
    makeInitDepositAccountIx(reserve, account) {
        return this.client.program.instruction.initDepositAccount(account.bumpSeed, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                reserve: reserve.address,
                depositNoteMint: reserve.data.depositNoteMint,
                depositor: this.address,
                depositAccount: account.address,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            },
        });
    }
    makeInitCollateralAccountIx(reserve, account) {
        return this.client.program.instruction.initCollateralAccount(account.bumpSeed, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                reserve: reserve.address,
                depositNoteMint: reserve.data.depositNoteMint,
                owner: this.address,
                obligation: this.obligation.address,
                collateralAccount: account.address,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            },
        });
    }
    makeInitLoanAccountIx(reserve, account) {
        return this.client.program.instruction.initLoanAccount(account.bumpSeed, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                reserve: reserve.address,
                loanNoteMint: reserve.data.loanNoteMint,
                owner: this.address,
                obligation: this.obligation.address,
                loanAccount: account.address,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            },
        });
    }
    makeInitObligationAccountIx() {
        return this.client.program.instruction.initObligation(this.obligation.bumpSeed, {
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                obligation: this.obligation.address,
                borrower: this.address,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
            },
        });
    }
    async refresh() {
        this._loans = [];
        this._deposits = [];
        this._collateral = [];
        for (const reserve of this.market.reserves) {
            await this.refreshReserve(reserve);
        }
    }
    async refreshReserve(reserve) {
        const accounts = await this.findReserveAccounts(reserve);
        await this.refreshAccount(this._deposits, accounts.deposits);
        await this.refreshAccount(this._loans, accounts.loan);
        await this.refreshAccount(this._collateral, accounts.collateral);
    }
    async refreshAccount(appendTo, account) {
        try {
            const info = await this.conn.getAccountInfo(account.address);
            const tokenAccount = spl_token_1.AccountLayout.decode(info.data);
            appendTo.push({
                mint: tokenAccount.mint,
                amount: tokenAccount.amount,
            });
        }
        catch (e) {
            // ignore error, which should mean it's an invalid/uninitialized account
        }
    }
    async findReserveAccounts(reserve) {
        const deposits = await this.client.findDerivedAccount([
            "deposits",
            reserve.address,
            this.address,
        ]);
        const loan = await this.client.findDerivedAccount([
            "loan",
            reserve.address,
            this.obligation.address,
            this.address,
        ]);
        const collateral = await this.client.findDerivedAccount([
            "collateral",
            reserve.address,
            this.obligation.address,
            this.address,
        ]);
        return {
            deposits,
            loan,
            collateral,
        };
    }
    /**
     * Get all the deposits held by the user, excluding those amounts being
     * used as collateral for a loan.
     */
    deposits() {
        return this._deposits;
    }
    /**
     * Get all the collateral deposits held by the user.
     */
    collateral() {
        return this._collateral;
    }
    /**
     * Get the loans held by the user
     */
    loans() {
        return this._loans;
    }
}
exports.JetUser = JetUser;
//# sourceMappingURL=user.js.map