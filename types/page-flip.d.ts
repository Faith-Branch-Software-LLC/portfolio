declare module 'page-flip' {
  export interface PageFlipOptions {
    width?: number;
    height?: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    renderWhileFlipping?: boolean;
  }

  export class PageFlip {
    constructor(element: HTMLElement, options?: PageFlipOptions);
    loadFromHTML(elements: NodeListOf<Element>): void;
    updateFromHtml(elements: NodeListOf<Element>): void;
    turnToPrevPage(): void;
    turnToNextPage(): void;
    turnToPage(page: number): void;
    flip(page: number): void;
    destroy(): void;
    on(eventName: string, callback: (e: any) => void): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getCurrentSpreadIndex(): number;
    updateFromImages(images: string[]): void;
  }
} 