# Better Rust Tests for Visual Studio Code

The **Better Rust Tests** extension enhances your Rust development experience in Visual Studio Code by providing convenient ways to run and watch your Rust tests directly from the editor.

![Extension Demo](assets/demo.gif)

## Features

- **Run Tests:** Easily run individual test functions with a single click.
- **Watch Tests:** Automatically rerun tests on file changes using `cargo watch`.
- **Run Release Tests:** Execute tests in release mode for performance benchmarking.
- **Watch Release Tests:** Continuously run release tests with live updates.
- **Supports Async Tests:** Detects and runs async tests like `#[tokio::test]`.
- **Module-Aware Test Discovery:** Accurately identifies test functions within modules.
- **Customizable Commands:** Configure custom test commands and flags.

## Installation

1. **Install from the VS Code Marketplace:**

   - Open Visual Studio Code.
   - Go to the Extensions view by clicking on the Extensions icon in the Activity Bar (`Ctrl+Shift+X` or `Cmd+Shift+X`).
   - Search for `Better Rust Tests`.
   - Click **Install** on the extension named **Better Rust Tests** by **samuelgja**.

2. **Install Required Tools:**

   - Ensure you have Rust and Cargo installed. If not, install them from [rustup.rs](https://rustup.rs/).
   - Install `cargo-watch` for watch mode functionality:

     ```bash
     cargo install cargo-watch
     ```

## Usage

1. **Open a Rust Project:**

   - Open a Rust project or workspace in Visual Studio Code.

2. **Write Tests:**

   - Create test functions using `#[test]` or `#[tokio::test]` attributes.

     ```rust
     #[cfg(test)]
     mod tests {
         use super::*;

         #[test]
         fn test_sync_function() {
             assert_eq!(add(2, 2), 4);
         }

         #[tokio::test]
         async fn test_async_function() {
             assert_eq!(async_add(2, 2).await, 4);
         }
     }
     ```

3. **Run Tests:**

   - Hover over a test function.
   - Click on the **Run Test**, **Watch Test**, **Run Release Test**, or **Watch Release Test** CodeLens that appears above the function.

     ![CodeLens Example](assets/codelens_example.png)

4. **View Results:**

   - The test results will appear in the integrated terminal.
   - For watch mode, the tests will rerun automatically when you make changes.

## Configuration

You can customize the extension's behavior through the following settings:

### Settings

- **`rust.tests.filePattern`**

  - **Type:** `string`
  - **Default:** `**/*.rs`
  - **Description:** Glob pattern to match Rust test files.

- **`rust.tests.customFlag`**

  - **Type:** `string`
  - **Default:** `""`
  - **Description:** Custom flags added to the end of the test command.

- **`rust.tests.customScript`**

  - **Type:** `string`
  - **Default:** `"cargo test"`
  - **Description:** Custom script to use instead of `cargo test`.

### Example Configuration

To customize the debounce time for watch mode or add additional flags:

1. Open your VS Code settings (`Ctrl+,` or `Cmd+,`).
2. Search for `Better Rust Tests`.
3. Adjust the settings as needed.

```json
{
    "rust.tests.customFlag": "--verbose",
    "rust.tests.customScript": "cargo test"
}
