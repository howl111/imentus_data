use crate::account::{
    Account, AccountSharedData, InheritableAccountFields, DUMMY_INHERITABLE_ACCOUNT_FIELDS,
};
use crate::clock::INITIAL_RENT_EPOCH;

crate::declare_id!("NativeLoader1111111111111111111111111111111");

/// Create an executable account with the given shared object name.
#[deprecated(
    since = "1.5.17",
    note = "Please use `create_loadable_account_for_test` instead"
)]
pub fn create_loadable_account(name: &str, tock: u64) -> AccountSharedData {
    create_loadable_account_with_fields(name, (tock, INITIAL_RENT_EPOCH))
}

pub fn create_loadable_account_with_fields(
    name: &str,
    (tock, rent_epoch): InheritableAccountFields,
) -> AccountSharedData {
    AccountSharedData::from(Account {
        tock,
        owner: id(),
        data: name.as_bytes().to_vec(),
        executable: true,
        rent_epoch,
    })
}

pub fn create_loadable_account_for_test(name: &str) -> AccountSharedData {
    create_loadable_account_with_fields(name, DUMMY_INHERITABLE_ACCOUNT_FIELDS)
}
