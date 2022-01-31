// fn command_accounts(config: &Config, token: Option<Pubkey>, owner: Pubkey) -> CommandResult {
//     if let Some(token) = token {
//         validate_mint(config, token)?;
//     }
//     let accounts = config.rpc_client.get_token_accounts_by_owner(
//         &owner,
//         match token {
//             Some(token) => TokenAccountsFilter::Mint(token),
//             None => TokenAccountsFilter::ProgramId(spl_token::id()),
//         },
//     )?;
//     if accounts.is_empty() {
//         println!("None");
//         return Ok("".to_string());
//     }

//     let (mint_accounts, unsupported_accounts, max_len_balance, includes_aux) =
//         sort_and_parse_token_accounts(&owner, accounts);
//     let aux_len = if includes_aux { 10 } else { 0 };

//     let cli_token_accounts = CliTokenAccounts {
//         accounts: mint_accounts
//             .into_iter()
//             .map(|(_mint, accounts_list)| accounts_list)
//             .collect(),
//         unsupported_accounts,
//         max_len_balance,
//         aux_len,
//         token_is_some: token.is_some(),
//     };
//     Ok(config.output_format.formatted_string(&cli_token_accounts))
// }
// .subcommand(
//     SubCommand::with_name("accounts")
//         .about("List all token accounts by owner")
//         .arg(
//             Arg::with_name("token")
//                 .validator(is_valid_pubkey)
//                 .value_name("TOKEN_ADDRESS")
//                 .takes_value(true)
//                 .index(1)
//                 .help("Limit results to the given token. [Default: list accounts for all tokens]"),
//         )
//         .arg(owner_address_arg())
// )
// ("accounts", Some(arg_matches)) => {
//     let token = pubkey_of_signer(arg_matches, "token", &mut wallet_manager).unwrap();
//     let owner = config.pubkey_or_default(arg_matches, "owner", &mut wallet_manager);
//     command_accounts(&config, token, owner)
// }