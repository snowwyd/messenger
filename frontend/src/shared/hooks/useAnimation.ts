import { useEffect, useRef } from 'react';

type CurveFunction = (x: number) => number;
type AnimationFunction = (progress: number) => void;

interface Curves {
    easeInOutCirc: CurveFunction;
    easeOutExpo: CurveFunction;
}

const curves: Curves = {
    easeInOutCirc: (x) => {
        return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
    },
    easeOutExpo: (x) => {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    },
};

export function useAnimation() {
    const animationRef = useRef(0);

    function startAnimation(curveFunction: CurveFunction, animationFunction: AnimationFunction, duration: number) {
        const startTime = performance.now();

        animationRef.current = requestAnimationFrame(animate);

        function animate(currentTime: number) {
            let timeFraction = (currentTime - startTime) / duration;
            if (timeFraction > 1) timeFraction = 1;
            if (timeFraction < 0) timeFraction = 0;

            const progress = curveFunction(timeFraction);
            animationFunction(progress);

            if (timeFraction < 1) animationRef.current = requestAnimationFrame(animate);
        }
    }

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return [startAnimation, curves] as const;
}
