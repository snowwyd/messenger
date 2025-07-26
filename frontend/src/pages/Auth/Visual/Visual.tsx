import { useEffect, useState } from 'react';

import styles from './Visual.module.css';

interface Module {
    default: string;
}

interface VisualProps {
    ref: React.Ref<HTMLButtonElement>;
}

type ModuleRecord = Record<string, Module>;

const files: ModuleRecord = import.meta.glob('@/assets/images/auth-page/*.{png,jpg,jpeg,mp4,webm}', { eager: true });

const visuals = Object.entries(files).map(([path, module]) => {
    const extension = path.split('.').pop() ?? '';
    const type = ['mp4', 'webm'].includes(extension) ? 'video' : 'image';

    return {
        type: type,
        src: module.default,
    };
});

const pickedVisualNumber = Number(localStorage.getItem('pickedAuthVisual') || 0);

export default function Visual({ ref }: VisualProps) {
    const [pickedVisual, setPickedVisual] = useState(pickedVisualNumber);

    useEffect(() => {
        localStorage.setItem('pickedAuthVisual', String(pickedVisual));
    }, [pickedVisual]);

    function switchVisual() {
        setPickedVisual((prev) => (prev < visuals.length - 1 ? prev + 1 : 0));
    }

    const visual = visuals[pickedVisual];

    return (
        <button ref={ref} className={styles.visual} onClick={switchVisual} aria-hidden="true" tabIndex={-1}>
            {visual.type === 'image' ? (
                <img src={visual.src} alt="" />
            ) : (
                <video src={visual.src} autoPlay muted loop playsInline />
            )}
        </button>
    );
}
