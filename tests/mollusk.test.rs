// Mollusk tests run in Rust using the mollusk crate
// Add to programs/generated/Cargo.toml:
//
// [dev-dependencies]
// mollusk-svm = "0.1.0"

#[cfg(test)]
mod tests {
    use super::*;
    use mollusk_svm::Mollusk;
    
    #[test]
    fn test_initialize() {
        let mut mollusk = Mollusk::new(&id(), "generated");
        
        // Your test code here
    }
}
