#[cfg(test)]
mod other_tests {
    #[test]
    fn it_works_other_deep() {
        println!("Hello from it_works_other_deep");
        // slee for 1 second
        std::thread::sleep(std::time::Duration::from_secs(1));
        println!("Hello from it_works_other_deep after sleep");
        assert_eq!(2 + 2, 4);
    }

    #[tokio::test]
    async fn it_works_in_async_other_deep() {
        assert_eq!(2 + 2, 4);
    }
}
