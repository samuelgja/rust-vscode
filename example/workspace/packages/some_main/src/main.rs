fn main() {
    println!("Hello, world!");
}

#[cfg(test)]
mod tests {
    #[test]

    fn it_works_on_main() {
        assert_eq!(2 + 2, 4);
    }

    #[test]

    fn it_works_on_main2() {
        assert_eq!(2 + 2, 4);
    }

    #[tokio::test]
    async fn it_works_in_async_on_main() {
        assert_eq!(2 + 2, 4);
    }
}
