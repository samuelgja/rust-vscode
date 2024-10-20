#[cfg(test)]
mod other_tests {
    #[test]
    fn it_works_other() {
        println!("Hello from it_works_other");
        // slee for 1 second
        std::thread::sleep(std::time::Duration::from_secs(1));
        println!("Hello from it_works_other after sleep");
        assert_eq!(2 + 2, 4);
    }

    #[tokio::test]
    async fn it_works_in_async_other() {
        assert_eq!(2 + 2, 4);
    }
}
