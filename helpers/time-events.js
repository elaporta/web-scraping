// Timer
let timer = new Date().getTime();

// Reset timer
export const resetTimer = () => {
    timer = new Date().getTime();
}

// Log elapsed time
export const logElapsedTime = () => {
    console.log(`> time elapsed: ${new Date().getTime() - timer} ms.`);
}