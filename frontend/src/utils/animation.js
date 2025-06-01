export const curves = {
    easeInOutCirc: (x) =>
        x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,
    easeOutExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
};

export function startAnimation(curveFunction, animationFunction, duration) {
    const startTime = performance.now();

    requestAnimationFrame(animate);

    function animate(currentTime) {
        let timeFraction = (currentTime - startTime) / duration;
        if (timeFraction > 1) timeFraction = 1;
        if (timeFraction < 0) timeFraction = 0;

        let progress = curveFunction(timeFraction);
        animationFunction(progress);

        if (timeFraction < 1) requestAnimationFrame(animate);
    }
}
