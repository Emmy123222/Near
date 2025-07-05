# Code Citations

## License: unknown
https://github.com/peppapighs/near-vault/tree/a689eeeb50eb0ccd0b03cda2f42880aaee4cc9c2/contract/src/storage.rs

```
};

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    #[test]
    fn
```

