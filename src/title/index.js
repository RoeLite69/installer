const LAUNCHERS = ['OSRS', 'OSRSPS', 'OSNR', 'Vulcan', 'August'];
const WALLPAPERS = Array.from({length: 11}, (_, index) => `${index + 1}.webp`);
let UPDATE = false; // Default to false, updated based on version info
let LATEST_VER = '1.0.0';
let LOCAL_VER = '1.0.0';
let JRE_INSTALLED = false;

document.addEventListener('DOMContentLoaded', function () {
  setBackgroundRandom();
  setInterval(setBackgroundRandom, (1 + Math.random() * 9) * 60_000); // Random time between 1 and 10 minutes
});

function setBackgroundRandom() {
  // Randomly select a wallpaper filename
  const randomWallpaper = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
  // Get the current background image URL
  const currentBackgroundImage = document.body.style.backgroundImage;
  // Create a new URL for the background image
  const newBackgroundImage = `url('../img/wallpapers/${randomWallpaper}')`;
  // If the new background is different from the current, update it
  if (currentBackgroundImage !== newBackgroundImage) {
    document.body.style.backgroundImage = newBackgroundImage;
  }
}

function createButton(name) {
  const button = document.createElement('button');
  button.className = 'play';
  button.textContent = `Play ${name}`;
  let animationTimeout;
  button.addEventListener('click', function () {
    if (button.disabled || !JRE_INSTALLED) return;
    window.api.runJar(`${name.toLowerCase()}/${name}-Launcher.jar`);
    // Reset any ongoing animation
    clearTimeout(animationTimeout);
    button.classList.remove('filling');
    button.classList.add('reset');
    // Force a reflow to ensure the reset class is applied immediately
    button.offsetWidth;
    button.classList.remove('reset');
    button.disabled = true;
    button.style.backgroundColor = '#213c24';
    button.classList.add('filling'); // Start the filling animation
    animationTimeout = setTimeout(() => {
      button.disabled = false;
      button.style.backgroundColor = '#228f29';
      button.classList.remove('filling');
    }, 10_000);
  });
  return button;
}

function createUpdateButton() {
  const button = document.createElement('button');
  button.className = 'update';
  button.textContent = `Update Launcher: ${LOCAL_VER} -> ${LATEST_VER}`;
  button.addEventListener('click', function () {
    if (button.disabled || !JRE_INSTALLED) return;
    window.api.downloadAndUpdate();
    button.disabled = true;
    button.textContent = `Updating Launcher (0%)...`;
  });
  return button;
}

window.api.onVersionInfo(({jdk, local, remote, update}) => {
  const versionFooter = document.getElementById('version-footer');
  const currentVersions = versionFooter.textContent.split('|').reduce((acc, part) => {
    const [key, value] = part
      .trim()
      .split(':')
      .map(s => s.trim());
    acc[key] = value;
    return acc;
  }, {});
  const newJavaVersion = jdk ? jdk : currentVersions['Java'];
  const newLauncherVersion = local ? local : currentVersions['Launcher'];
  versionFooter.textContent = `Java: ${newJavaVersion} | Launcher: ${newLauncherVersion}`;
  if (update === true) {
    UPDATE = update;
    LOCAL_VER = local;
    LATEST_VER = remote;
  }
  if (jdk === '11.0.22') {
    JRE_INSTALLED = true;
  }
  setupLauncherButtons();
});

window.api.onUpdateProgress(({progress}) => {
  const updateButton = document.querySelector('.update');
  if (updateButton) {
    if (progress === 100.0) {
      updateButton.textContent = `Restarting Launcher...`;
    } else {
      updateButton.textContent = `Updating Launcher (${progress}%)...`;
    }
  }
});

function setupLauncherButtons() {
  const container = document.getElementById('buttonContainer');
  // Clear existing content in the container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.style.display = 'flex';
  LAUNCHERS.forEach(name => {
    // Create a container for each logo and button pair
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    // Create logo element
    const logo = document.createElement('img');
    logo.src = `../img/${name.toLowerCase()}.png`;
    logo.className = 'button-logo';
    buttonContainer.appendChild(logo); // Append logo to the button container
    // Create button
    const button = createButton(name);
    button.innerText = `Play ${name}`;
    button.classList.add('play');
    buttonContainer.appendChild(button); // Append button to the button container
    // Create a progress bar container
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar';
    // Create the progress bar itself
    const progressBar = document.createElement('div');
    progressBar.id = `progress-${name}`;
    progressBar.className = 'progress-bar-value';
    // Append the progress bar to its container
    progressBarContainer.appendChild(progressBar);
    // Append the progress bar container after the button
    buttonContainer.appendChild(progressBarContainer);
    container.appendChild(buttonContainer); // Append the button container to the main container
  });
  // Append the update button if required
  if (UPDATE) {
    container.appendChild(createUpdateButton());
  }
}
