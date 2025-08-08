export interface ScrollApi {
    updateThumb: () => void;
    setScrollTop: (scrollTop: number) => void;
    scrollToBottom: () => void;
    scrollBottom: React.RefObject<number>;
    contentRef: React.RefObject<HTMLDivElement | null>;
}
