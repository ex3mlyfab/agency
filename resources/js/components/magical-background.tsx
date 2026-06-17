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
        // Generate stable particles after mounting to avoid SSR mismatch
        const generated: Particle[] = Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            size: Math.random() * 4 + 2, // 2px to 6px
            duration: Math.random() * 15 + 10, // 10s to 25s
            delay: Math.random() * -20, // Negative delay to start immediately
            driftX: `${(Math.random() - 0.5) * 80}px`,
            twinkleDuration: Math.random() * 4 + 2, // 2s to 6s
        }));
        setParticles(generated);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-950 animate-gradient-slow">
            {/* Ambient Magical Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-slate-950 to-emerald-950/80" />
            
            {/* Glowing Orb 1 */}
            <div 
                className="absolute -top-1/4 -left-1/4 h-[80%] w-[80%] rounded-full bg-violet-600/10 blur-[120px] transition-transform duration-[10000ms] ease-in-out"
                style={{
                    animation: 'gradient-flow 25s ease infinite alternate',
                }}
            />
            
            {/* Glowing Orb 2 */}
            <div 
                className="absolute -bottom-1/4 -right-1/4 h-[80%] w-[80%] rounded-full bg-emerald-600/10 blur-[120px] transition-transform duration-[10000ms] ease-in-out"
                style={{
                    animation: 'gradient-flow 20s ease infinite alternate-reverse',
                }}
            />

            {/* Glowing Orb 3 (Center Deep Blue) */}
            <div className="absolute top-1/2 left-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[100px]" />

            {/* Elegant Floating Sparkles */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute bottom-0 rounded-full bg-white/70"
                        style={{
                            left: particle.left,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            filter: 'blur(0.5px) drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))',
                            animation: `float-particle ${particle.duration}s linear infinite, twinkle-particle ${particle.twinkleDuration}s ease-in-out infinite`,
                            animationDelay: `${particle.delay}s`,
                            '--drift-x': particle.driftX,
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            {/* Overlay Grid to give it tech/premium depth */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>
    );
}
