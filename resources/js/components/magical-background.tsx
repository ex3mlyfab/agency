import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    left: string;
    size: number;
    duration: number;
    delay: number;
    driftX: string;
    twinkleDuration: number;
}

export default function MagicalBackground() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate a few stable accent particles after mounting.
        // Avoid calling setState synchronously in the effect body.
        const generated: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            size: Math.random() * 3 + 2, // 2px to 5px
            duration: Math.random() * 12 + 14, // 14s to 26s
            delay: Math.random() * -20, // Negative delay to start immediately
            driftX: `${(Math.random() - 0.5) * 60}px`,
            twinkleDuration: Math.random() * 4 + 3, // 3s to 7s
        }));

        // Schedule state update for the next tick.
        const t = window.setTimeout(() => {
            setParticles(generated);
        }, 0);

        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden bg-transparent">
            {/* Single, subtle primary-glow accent for depth (no busy gradients) */}
            <div className="absolute -top-1/4 -left-1/4 h-[70%] w-[70%] rounded-full bg-primary/15 blur-[140px]" />

            {/* A few calm accent sparkles */}
            <div className="pointer-events-none absolute inset-0">
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute bottom-0 rounded-full bg-primary/40 dark:bg-primary/50"
                        style={
                            {
                                left: particle.left,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                filter: 'blur(0.5px) drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))',
                                animation: `float-particle ${particle.duration}s linear infinite, twinkle-particle ${particle.twinkleDuration}s ease-in-out infinite`,
                                animationDelay: `${particle.delay}s`,
                                '--drift-x': particle.driftX,
                            } as React.CSSProperties
                        }
                    />
                ))}
            </div>
        </div>
    );
}
