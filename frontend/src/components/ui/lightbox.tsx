import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface LightBoxProps {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

/**
 * Fullscreen image viewer with zoom-in/zoom-out animation.
 * Supports multi-image navigation via arrow keys and chevron buttons.
 * Includes zoom functionality.
 */
export const LightBox = ({ images, index, onClose, onIndexChange }: LightBoxProps) => {
  const isOpen = index !== null;
  const currentIndex = index ?? 0;
  const [isZoomed, setIsZoomed] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (isZoomed) return;
    if (onIndexChange && currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, images.length, onIndexChange, isZoomed]);

  const goPrev = useCallback(() => {
    if (isZoomed) return;
    if (onIndexChange && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange, isZoomed]);

  const toggleZoom = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsZoomed(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) setIsZoomed(false);
        else onClose();
      }
      if (e.key === 'ArrowRight' && !isZoomed) goNext();
      if (e.key === 'ArrowLeft' && !isZoomed) goPrev();
      if (e.key === '+' || e.key === '=') setIsZoomed(true);
      if (e.key === '-') setIsZoomed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev, isZoomed]);

  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div
      id="lightbox-portal"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-90"
      >
        <X size={20} />
      </button>

      {/* Zoom toggle button */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
        className="absolute top-4 right-16 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-90"
        title={isZoomed ? 'Zoom Out' : 'Zoom In'}
      >
        {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
      </button>

      {/* Previous arrow */}
      {images.length > 1 && currentIndex > 0 && !isZoomed && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 z-[110] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-90 shadow-lg"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next arrow */}
      {images.length > 1 && currentIndex < images.length - 1 && !isZoomed && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 z-[110] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-90 shadow-lg"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Image Container */}
      <div
        className={`relative flex items-center justify-center w-full h-full transition-all duration-300 ${isZoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'}`}
        onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
      >
        <img
          key={images[currentIndex]}
          src={images[currentIndex]}
          alt=""
          className={`object-contain rounded-lg shadow-2xl select-none will-change-transform transition-transform duration-300 ${
            isZoomed
              ? 'm-auto min-w-full min-h-full scale-100'
              : 'max-w-[90vw] max-h-[90vh] scale-100'
          } ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          style={{ transitionProperty: 'opacity, transform' }}
          draggable={false}
          onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
        />
      </div>

      {/* Image counter */}
      {images.length > 1 && !isZoomed && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium tabular-nums bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 shadow-xl">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
};
