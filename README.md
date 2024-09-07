# RoeLite Launcher

RoeLite Launcher is a cross-platform Electron application designed to manage and launch RoeLite. This launcher handles
automatic updates, Java runtime management, and provides a user-friendly interface for launching the RoeLite client.

## Features

- Cross-platform support (Windows, macOS, Linux)
- Automatic updates for the launcher
- Java Runtime Environment (JRE) management
- One-click launch of the RoeLite client
- Squirrel-based installation and updates on Windows

## Prerequisites

- Node.js (v14.0.0 or later recommended)
- npm (usually comes with Node.js)
- Git (for cloning the repository)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/RoeLite69/installer.git
   ```

2. Navigate to the project directory:
   ```
   cd installer
   ```

3. Install dependencies:
   ```
   npm install
   ```

## Development

To run the application in development mode:

```
npm start
```

## Building

To build the application for your current platform:

```
npm run build
```

This will create executables in the `dist` folder.

## Project Structure

- `main.js`: The main Electron process file
- `preload.js`: Preload script for the renderer process
- `updateManager.js`: Handles checking for and applying updates
- `javaManager.js`: Manages Java runtime installation and version checking
- `utils.js`: Contains utility functions used across the application
- `squirrelHandler.js`: Handles Squirrel events for Windows installer
- `jarRunner.js`: Responsible for running the RoeLite JAR file

## Configuration

The application uses several environment-specific paths and URLs. These are defined in the respective modules and can be
adjusted as needed.

## Cross-platform Considerations

- Windows: Uses Squirrel for installation and updates
- macOS: Uses DMG for distribution
- Linux: Uses AppImage for distribution

The application handles these differences internally, providing a consistent experience across platforms.

## Java Management

The launcher automatically downloads and installs Java 11 if it's not present on the user's system. This ensures that
users always have the correct Java version to run RoeLite.

## Updating

The launcher checks for updates on startup and periodically while running. Updates are downloaded and applied
automatically, with the user being prompted to restart the application when an update is ready.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Support

For support, please open an issue on the GitHub repository or contact the maintainers directly.

---
