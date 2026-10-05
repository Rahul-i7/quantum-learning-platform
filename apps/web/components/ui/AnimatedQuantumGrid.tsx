'use client'

import { useEffect, useRef } from "react";
import { useTheme } from 'next-themes'

export default function AnimatedQuantumGrid({ onDark = false }: { onDark?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { resolvedTheme } = useTheme()

    const light = !onDark && resolvedTheme !== 'dark'

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        const gridSize = 48;

        // Pulse particles moving along grid lines
        const pulses: Array<{
            x: number;
            y: number;
            axis: "x" | "y";
            speed: number;
            length: number;
            color: string;
        }> = [];

        // Softer, lower-brightness color palette
        const colors = light
            ? ["rgba(37, 99, 235, 0.5)", "rgba(24, 24, 27, 0.35)", "rgba(124, 58, 237, 0.4)"]
            : ["rgba(96, 165, 250, 0.6)", "rgba(255, 255, 255, 0.45)", "rgba(167, 139, 250, 0.5)"];
        const fade = light ? "rgba(24, 24, 27, 0)" : "rgba(255, 255, 255, 0)";

        const handleResize = () => {
            if (!canvas.parentElement) return;
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        // Spawn pulses less frequently
        const spawnInterval = setInterval(() => {
            if (pulses.length >= 16) return;

            const isHorizontal = Math.random() > 0.5;
            const cols = Math.floor(canvas.width / gridSize);
            const rows = Math.floor(canvas.height / gridSize);

            if (isHorizontal) {
                const randomRow = Math.floor(Math.random() * rows);
                pulses.push({
                    x: 0,
                    y: randomRow * gridSize,
                    axis: "x",
                    speed: Math.random() * 0.8 + 0.6, // Slower, calmer movement
                    length: Math.random() * 50 + 30,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });
            } else {
                const randomCol = Math.floor(Math.random() * cols);
                pulses.push({
                    x: randomCol * gridSize,
                    y: 0,
                    axis: "y",
                    speed: Math.random() * 0.8 + 0.6, // Slower, calmer movement
                    length: Math.random() * 50 + 30,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });
            }
        }, 1200); // Increased interval to 1.2s for fewer particles

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];

                if (p.axis === "x") {
                    p.x += p.speed;
                    if (p.x - p.length > canvas.width) {
                        pulses.splice(i, 1);
                        continue;
                    }

                    const gradient = ctx.createLinearGradient(p.x - p.length, p.y, p.x, p.y);
                    gradient.addColorStop(0, fade);
                    gradient.addColorStop(1, p.color);

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 1; // Thinner stroke for lower brightness
                    ctx.beginPath();
                    ctx.moveTo(p.x - p.length, p.y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                } else {
                    p.y += p.speed;
                    if (p.y - p.length > canvas.height) {
                        pulses.splice(i, 1);
                        continue;
                    }

                    const gradient = ctx.createLinearGradient(p.x, p.y - p.length, p.x, p.y);
                    gradient.addColorStop(0, "rgba(255,255,255,0)");
                    gradient.addColorStop(1, p.color);

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 1; // Thinner stroke for lower brightness
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y - p.length);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            clearInterval(spawnInterval);
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [light]);

    const line = light ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.6)";

    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
                // Radial fade-out towards all 4 edges
                maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)",
            }}
        >
            {/* Background Grid Lines (Subtle Opacity) */}
            <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage: `
                        linear-gradient(${line} 1px, transparent 1px),
                        linear-gradient(90deg, ${line} 1px, transparent 1px)
                    `,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Subdued Light Pulses Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-35" />
        </div>
    );
}