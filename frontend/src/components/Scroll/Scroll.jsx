import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import './Scroll.css';

export default function Scroll({ wrapperClass, isMessages = false, children }) {
    const contentRef = useRef(null);
    const thumbRef = useRef(null);
    const location = useLocation();

    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    useEffect(() => {
        if (isMessages) contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }, [location.pathname]);

    useEffect(() => {
        if (isMessages) contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }, []);
    
    useEffect(() => {
        updateThumbHeight();
        updateThumbPosition();

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDragging);

        return () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDragging);
        }
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
        const thumbHeight = Math.max((containerHeight / contentHeight) * containerHeight, 40); // Минимум 40px
        thumbRef.current.style.height = `${thumbHeight}px`;

        if (thumbHeight >= containerHeight) {
            thumbRef.current.style.height = `0px`;
        }
    }

    function updateThumbPosition() {
        const contentScrollTop = contentRef.current.scrollTop;
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        const scrollRatio = contentScrollTop / (contentHeight - containerHeight);
        const thumbTop = scrollRatio * (containerHeight - thumbRef.current.clientHeight);
        thumbRef.current.style.top = `${thumbTop}px`;
    }

    return (
        <>
            <div className={`scrollable-content ${wrapperClass}`} ref={contentRef} onScroll={updateThumbPosition}>{children}</div>
            <div className='custom-scrollbar'>
                <div className='custom-thumb' ref={thumbRef} onMouseDown={startDragging}></div>
            </div>
        </>
    )
}