#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        println!("Hello from simple_lib");
        // slee for 1 second
        std::thread::sleep(std::time::Duration::from_secs(1));
        println!("Hello from simple_lib after sleep");
        assert_eq!(2 + 2, 4);
    }

    #[tokio::test]
    async fn it_works_in_async() {
        assert_eq!(2 + 2, 4);
    }
}
