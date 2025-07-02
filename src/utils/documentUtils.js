export const enterFullScreen = () => {
  if (isFullScreen()) {
    exitFullScreen();
    return
  }

  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem
      .requestFullscreen()
      .catch((err) => console.log("FullScreen error:", err));
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
};

export const exitFullScreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

export const isFullScreen = () => {
  return document.fullscreenElement != null;
};
