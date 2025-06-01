import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import styles from './Scroll.module.css';

export default function Scroll({ wrapperClass, messageTrigger = null, loadEmoji = null, children }) {
    const contentRef = useRef(null);
    const thumbRef = useRef(null);
    const location = useLocation();

    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    const lastScrollHeight = useRef(0);

    useEffect(() => {
        if (messageTrigger !== null) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [location.pathname, messageTrigger]);

    useEffect(() => {
        const contentHeight = contentRef.current.scrollHeight;
        if (!contentHeight) return;
        if (messageTrigger == null) return;
        const contentScrollTop = contentRef.current.scrollTop;
        const containerHeight = contentRef.current.clientHeight;

        const isAtBottom = contentHeight - contentScrollTop - containerHeight < 50;

        if (contentHeight > lastScrollHeight.current && isAtBottom) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }

        lastScrollHeight.current = contentHeight;
    });

    useEffect(() => {
        updateThumbHeight();
        updateThumbPosition();

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDragging);

        return () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDragging);
        };
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
        const thumbHeight = Math.max((containerHeight / contentHeight) * containerHeight, 40);
        thumbRef.current.style.height = `${thumbHeight - 10}px`;

        if (thumbHeight >= containerHeight) {
            thumbRef.current.style.height = `0px`;
        }
    }

    function updateThumbPosition() {
        const contentScrollTop = contentRef.current.scrollTop;
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        if (loadEmoji !== null && contentScrollTop >= contentHeight - containerHeight - 20) loadEmoji();
        const scrollRatio = contentScrollTop / (contentHeight - containerHeight);
        const thumbTop = scrollRatio * (containerHeight - thumbRef.current.clientHeight - 10);
        thumbRef.current.style.top = `${thumbTop + 5}px`;
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
