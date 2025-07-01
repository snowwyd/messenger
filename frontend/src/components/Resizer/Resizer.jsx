import { useEffect, useRef, useState } from 'react';
import styles from './Resizer.module.css';

export default function Resizer({ className, resizableRef, clamp, isLeftSide = false }) {
    const isResizing = useRef(false);
    const labelRef = useRef(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    function handleMouseDown(event) {
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';
        isResizing.current = true;
        labelRef.current.style.visibility = 'visible';

        handleMouseMove(event);
    }

    function handleMouseMove(event) {
        if (!isResizing.current) return;
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
        labelRef.current.style.visibility = 'hidden';
    }

    function moveLabel(event) {
        labelRef.current.style.left = event.clientX + 5 + 'px';
        labelRef.current.style.top = event.clientY - 35 + 'px';
    }

    return (
        <>
            <div className={`${styles.resizer} ${className}`} onMouseDown={handleMouseDown}></div>
            <div className={styles.label} ref={labelRef}>
                {width}px
            </div>
        </>
    );
}
