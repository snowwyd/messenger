import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import styles from './Resizer.module.css';

interface ResizerProps {
    className: string;
    resizableRef: React.RefObject<HTMLElement | null>;
    clamp: [number, number];
    isLeftSide?: boolean;
}

export default function Resizer({ className, resizableRef, clamp, isLeftSide = false }: ResizerProps) {
    const labelRef = useRef<HTMLDivElement>(null);

    const isResizing = useRef(false);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';
        isResizing.current = true;
        labelRef.current?.style.setProperty('visibility', 'visible');

        handleMouseMove(event.nativeEvent);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isResizing.current || !resizableRef.current) return;
        moveLabel(event);
        const difference = isLeftSide
            ? resizableRef.current.getBoundingClientRect().right - event.clientX
            : event.clientX - resizableRef.current.getBoundingClientRect().left;

        const newWidth = Math.min(Math.max(difference, clamp[0]), clamp[1]);
        resizableRef.current.style.width = newWidth + 'px';
        setWidth(newWidth);
    }

    function handleMouseUp() {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        isResizing.current = false;
        labelRef.current?.style.setProperty('visibility', 'hidden');
    }

    function moveLabel(event: MouseEvent) {
        labelRef.current?.style.setProperty('left', event.clientX + 5 + 'px');
        labelRef.current?.style.setProperty('top', event.clientY - 35 + 'px');
    }

    return (
        <>
            <div className={clsx(styles.resizer, className)} onMouseDown={handleMouseDown} aria-hidden="true"></div>
            <div className={styles.label} ref={labelRef}>
                {width}px
            </div>
        </>
    );
}
