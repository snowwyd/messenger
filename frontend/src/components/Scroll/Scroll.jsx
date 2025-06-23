import { useEffect, useRef } from 'react';

import styles from './Scroll.module.css';

const MIN_THUMB_HEIGHT = 40;
const THUMB_VERTICAL_PADDING = 10;
const THUMB_TOP_OFFSET = 5;

export default function Scroll({ wrapperClass, isReversedRender = false, callback = null, children }) {
    const contentRef = useRef(null);
    const thumbRef = useRef(null);

    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    useEffect(() => {
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDragging);

        return () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDragging);
        };
    }, []);

    useEffect(() => {
        updateThumbHeight();
        updateThumbPosition();
    });

    function startDragging(event) {
        document.body.style.userSelect = 'none';
        isDragging.current = true;
        startY.current = event.clientY;
        startScrollTop.current = contentRef.current.scrollTop;
    }

    function stopDragging() {
        document.body.style.userSelect = '';
        isDragging.current = false;
    }

    function onDrag(event) {
        if (!isDragging.current) return;
        const deltaY = event.clientY - startY.current;
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        const scrollRatio = (contentHeight - containerHeight) / (containerHeight - thumbRef.current.clientHeight);
        contentRef.current.scrollTop = startScrollTop.current + deltaY * scrollRatio;
    }

    function updateThumbHeight() {
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        const thumbHeight = Math.max((containerHeight / contentHeight) * containerHeight, MIN_THUMB_HEIGHT);
        thumbRef.current.style.height = `${thumbHeight - THUMB_VERTICAL_PADDING}px`;
        if (thumbHeight >= containerHeight) thumbRef.current.style.height = `0px`;
    }

    function updateThumbPosition() {
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        const contentScrollTop = isReversedRender
            ? contentHeight - containerHeight + contentRef.current.scrollTop
            : contentRef.current.scrollTop;

        if (callback) callback(contentScrollTop, contentHeight, containerHeight);

        const scrollRatio = contentScrollTop / (contentHeight - containerHeight);
        const thumbTop = scrollRatio * (containerHeight - thumbRef.current.clientHeight - THUMB_VERTICAL_PADDING);
        thumbRef.current.style.top = `${thumbTop + THUMB_TOP_OFFSET}px`;
    }

    return (
        <>
            <div
                className={`${styles.scrollableContent} ${wrapperClass}`}
                ref={contentRef}
                onScroll={updateThumbPosition}
            >
                {children}
            </div>
            <div className={styles.customScrollbar}>
                <div className={styles.customThumb} ref={thumbRef} onMouseDown={startDragging}></div>
            </div>
        </>
    );
}
