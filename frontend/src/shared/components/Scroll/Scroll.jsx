import { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';

const ScrollContext = createContext();

export const useScrollContext = () => useContext(ScrollContext);

import styles from './Scroll.module.css';

const MIN_THUMB_HEIGHT = 40;
const THUMB_VERTICAL_PADDING = 10;
const THUMB_TOP_OFFSET = 5;

function Scroll({ className, onScrollCallback = null, children }, ref) {
    const contentRef = useRef(null);
    const thumbRef = useRef(null);
    const scrollBottom = useRef(null);

    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(null);

    const getScrollApi = () => ({
        updateThumb: updateThumb,
        setScrollTop: (scrollTop) => {
            contentRef.current.scrollTop = scrollTop;
        },
        scrollToBottom: () => {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        },
        scrollBottom: scrollBottom,
        contentRef: contentRef,
    });

    const contextValue = getScrollApi();

    useImperativeHandle(ref, getScrollApi);

    useEffect(() => {
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDragging);

        return () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDragging);
        };
    }, []);

    useEffect(() => {
        updateThumb();

        const mutationObserver = new MutationObserver(updateThumb);
        const resizeObserver = new ResizeObserver(updateThumb);

        mutationObserver.observe(contentRef.current, { childList: true, subtree: true });
        resizeObserver.observe(contentRef.current);

        return () => {
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        };
    }, []);

    function updateThumb() {
        showScrollbar();
        updateThumbHeight();
        updateThumbPosition();
    }

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
        const contentScrollTop = contentRef.current.scrollTop;
        scrollBottom.current = contentHeight - containerHeight - contentScrollTop;
        const scrollRatio = contentScrollTop / (contentHeight - containerHeight);
        const thumbTop = scrollRatio * (containerHeight - thumbRef.current.clientHeight - THUMB_VERTICAL_PADDING);
        thumbRef.current.style.top = `${thumbTop + THUMB_TOP_OFFSET}px`;
    }

    function showScrollbar() {
        setVisible(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setVisible(false), 1500);
    }

    function onScroll() {
        updateThumbPosition();
        showScrollbar();
        if (onScrollCallback) onScrollCallback(contentRef.current);
    }

    return (
        <>
            <div className={`${styles.scrollableContent} ${className}`} ref={contentRef} onScroll={onScroll}>
                <ScrollContext.Provider value={contextValue}>{children}</ScrollContext.Provider>
            </div>
            <div className={styles.customScrollbar}>
                <div
                    ref={thumbRef}
                    className={`${styles.customThumb} ${visible ? styles.visible : styles.hidden}`}
                    onMouseEnter={showScrollbar}
                    onMouseDown={startDragging}
                ></div>
            </div>
        </>
    );
}

export default forwardRef(Scroll);
