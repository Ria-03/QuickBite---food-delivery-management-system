import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';

const SwipeButton = ({ onConfirm, text = "Swipe to Confirm", color = "var(--primary)", disabled = false }) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [position, setPosition] = useState(0);
    const containerRef = useRef(null);
    const sliderWidth = 50; // Width of the sliding knob
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, []);

    const handleTouchMove = (e) => {
        if (isConfirmed || disabled) return;
        const touch = e.touches[0];
        const containerRect = containerRef.current.getBoundingClientRect();
        let newX = touch.clientX - containerRect.left - sliderWidth / 2;

        const maxPos = containerWidth - sliderWidth;
        if (newX < 0) newX = 0;
        if (newX > maxPos) newX = maxPos;

        setPosition(newX);
    };

    const handleTouchEnd = () => {
        if (isConfirmed || disabled) return;
        const maxPos = containerWidth - sliderWidth;
        if (position > maxPos * 0.9) { // Threshold to confirm
            setPosition(maxPos);
            setIsConfirmed(true);
            if (onConfirm) onConfirm();
        } else {
            setPosition(0);
        }
    };

    // Mouse fallback for desktop testing
    const [isDragging, setIsDragging] = useState(false);
    const handleMouseMove = (e) => {
        if (!isDragging || isConfirmed || disabled) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - sliderWidth / 2;

        const maxPos = containerWidth - sliderWidth;
        if (newX < 0) newX = 0;
        if (newX > maxPos) newX = maxPos;

        setPosition(newX);
    };

    const handleMouseUp = () => {
        if (!isDragging || isConfirmed || disabled) return;
        setIsDragging(false);
        const maxPos = containerWidth - sliderWidth;
        if (position > maxPos * 0.9) {
            setPosition(maxPos);
            setIsConfirmed(true);
            if (onConfirm) onConfirm();
        } else {
            setPosition(0);
        }
    };


    return (
        <div
            ref={containerRef}
            className="swipe-btn-container"
            style={{
                position: 'relative',
                width: '100%',
                height: '56px',
                background: isConfirmed ? 'var(--success)' : 'var(--gray-light)',
                borderRadius: '50px',
                overflow: 'hidden',
                transition: 'background 0.3s ease',
                userSelect: 'none',
                opacity: disabled ? 0.6 : 1
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 700,
                    color: isConfirmed ? 'white' : 'var(--gray)',
                    zIndex: 1
                }}
            >
                {isConfirmed ? "CONFIRMED" : text}
            </div>

            <div
                onTouchStart={() => !disabled && !isConfirmed}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => !disabled && !isConfirmed && setIsDragging(true)}
                style={{
                    position: 'absolute',
                    top: '3px',
                    left: `${position}px`,
                    width: `${sliderWidth}px`,
                    height: '50px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    cursor: 'grab',
                    zIndex: 2,
                    transition: isDragging ? 'none' : 'left 0.3s ease'
                }}
            >
                {isConfirmed ? <Check size={24} color="var(--success)" /> : <ChevronRight size={24} color={color} />}
            </div>

            {/* Progress Fill */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${position + sliderWidth / 2}px`,
                background: color,
                opacity: 0.2
            }}></div>
        </div>
    );
};

export default SwipeButton;
