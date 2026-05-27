export const playSound = (type = "move") => {
  const audio = new Audio(`/online-chess/sound/${type}.mp3`);
  audio.volume = 1;
  audio.play().catch((err) => console.log("sound error:", err));
};