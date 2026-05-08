async function boot() {
  // Initialize sound engine
  SoundPlayer.init();

  // Load persisted state
  await AppState.load();

  // Load timer view
  await loadView('timer', 'views/timer-view.html');

  // Initialize router
  Router.init();

  // Initialize timer
  Timer.init();

  // Load mascot
  const mascot = AppState.mascotImage || await window.electronAPI.getDefaultMascot();
  if (mascot) {
    updateMascot(mascot);
  }

  // Apply always-on-top if saved
  if (AppState.settings.alwaysOnTop && window.electronAPI.setAlwaysOnTop) {
    window.electronAPI.setAlwaysOnTop(true);
  }
}

async function loadView(viewName, filePath) {
  try {
    const response = await fetch(filePath);
    if (response.ok) {
      const html = await response.text();
      const container = document.getElementById(`view-${viewName}`);
      if (container) {
        container.innerHTML = html;
      }
    }
  } catch (e) {
    console.warn(`Failed to load view ${viewName}:`, e);
  }
}

async function updateMascot(base64) {
  const img = document.getElementById('mascot-img');
  const placeholder = document.getElementById('mascot-placeholder');
  if (!img) return;

  const src = base64 || await window.electronAPI.getDefaultMascot();
  if (src) {
    img.src = src;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', boot);
