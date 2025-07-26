import { createContext, useCallback, use, useEffect, useImperativeHandle, useRef, useState } from 'react';
import clsx from 'clsx';

import { ScrollApi } from '@/types/ScrollApi';

import styles from './Scroll.module.css';

const ScrollContext = createContext<ScrollApi | null>(null);
export const useScrollContext = () => use(ScrollContext);

const MIN_THUMB_HEIGHT = 40;
const THUMB_VERTICAL_PADDING = 2.5;

interface ScrollProps {
    className?: string;
    onScrollCallback?: (content: HTMLDivElement) => void;
    children: React.ReactNode;
    ref?: React.RefObject<ScrollApi | null>;
}

export default function Scroll({ className, onScrollCallback, children, ref }: ScrollProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const scrollBottom = useRef(0);

    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(0);

    const updateThumb = useCallback(() => {
        showScrollbar();
        updateThumbHeight();
        updateThumbPosition();
    }, []);

    const getScrollApi = () => ({
        updateThumb: updateThumb,
        setScrollTop: (scrollTop: number) => {
            if (contentRef.current) {
                contentRef.current.scrollTop = scrollTop;
            }
        },
        scrollToBottom: () => {
            if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }
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

        if (contentRef.current) {
            mutationObserver.observe(contentRef.current, { childList: true, subtree: true });
            resizeObserver.observe(contentRef.current);
        }

        return () => {
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        };
    }, [updateThumb]);

    function startDragging(event: React.MouseEvent<HTMLDivElement>) {
        document.body.style.userSelect = 'none';
        isDragging.current = true;
        startY.current = event.clientY;
        if (contentRef.current) {
            startScrollTop.current = contentRef.current.scrollTop;
        }
    }

    function stopDragging() {
        document.body.style.userSelect = '';
        isDragging.current = false;
    }

    function onDrag(event: MouseEvent) {
        if (!isDragging.current || !contentRef.current || !thumbRef.current) return;

        const deltaY = event.clientY - startY.current;
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        const scrollRatio = (contentHeight - containerHeight) / (containerHeight - thumbRef.current.clientHeight);
        contentRef.current.scrollTop = startScrollTop.current + deltaY * scrollRatio;
    }

    function updateThumbHeight() {
        if (!contentRef.current || !thumbRef.current) return;

        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        const thumbHeight = Math.max((containerHeight / contentHeight) * containerHeight, MIN_THUMB_HEIGHT);
        thumbRef.current.style.height = `${thumbHeight - THUMB_VERTICAL_PADDING * 2}px`;
        if (thumbHeight >= containerHeight) thumbRef.current.style.height = `0px`;
    }

    function updateThumbPosition() {
        if (!contentRef.current || !thumbRef.current) return;

        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        const contentScrollTop = contentRef.current.scrollTop;
        scrollBottom.current = contentHeight - containerHeight - contentScrollTop;
        const scrollRatio = contentScrollTop / (contentHeight - containerHeight);
        const thumbTop = scrollRatio * (containerHeight - thumbRef.current.clientHeight - THUMB_VERTICAL_PADDING * 2);
        thumbRef.current.style.top = `${thumbTop + THUMB_VERTICAL_PADDING}px`;
    }

    function showScrollbar() {
        setVisible(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setVisible(false), 1500);
    }

    function onScroll() {
        updateThumbPosition();
        showScrollbar();
        if (onScrollCallback && contentRef.current) onScrollCallback(contentRef.current);
    }

    return (
        <>
            <div className={clsx(styles.scrollableContent, className)} ref={contentRef} onScroll={onScroll}>
                <ScrollContext value={contextValue}>{children}</ScrollContext>
            </div>
            <div className={styles.customScrollbar}>
                <div
                    ref={thumbRef}
                    className={clsx(styles.customThumb, !visible && styles.hidden)}
                    onMouseEnter={showScrollbar}
                    onMouseDown={startDragging}
                    aria-hidden="true"
                ></div>
            </div>
        </>
    );
}
