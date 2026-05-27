const sounds = {
  move: new Audio(process.env.PUBLIC_URL + "/sound/move.mp3"),

  capture: new Audio(process.env.PUBLIC_URL + "/sound/capture.mp3"),

  checkmate: new Audio(process.env.PUBLIC_URL + "/sound/checkmate.mp3"),
};

export const playSound = (type = "move") => {
  const sound = sounds[type];

  if (sound) {
    sound.currentTime = 0;

    sound.play().catch(() => {});
  }
};