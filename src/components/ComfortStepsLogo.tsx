import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function ComfortStepsLogo({ className = "", size = "md" }: LogoProps) {
  // Dimensions based on size preset
  const dimensions = {
    sm: { width: "120px", height: "45px", titleSize: "text-lg", subtitleSize: "text-[7px]" },
    md: { width: "180px", height: "65px", titleSize: "text-2xl", subtitleSize: "text-[10px]" },
    lg: { width: "240px", height: "85px", titleSize: "text-3xl", subtitleSize: "text-[12px]" }
  };

  const { width, height } = dimensions[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* SVG Shoe outline & Brand cursive Typography */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 240 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Subtle high-heel shoe silhouette resting on top of the 'o' and 'm' */}
        <path
          d="M 98,15 
             C 105,10  114,8  118,2 
             C 119,0.5  121,0  122.5,0.5 
             C 124,1  124.5,3  123.5,6 
             C 122.5,9  120,13  117,17 
             C 113.5,22.5  108.5,23.5  103,24.5 
             C 99,25.2  93.5,23.5  88,24 
             C 85,24.3  84,24.8  82,25.2
             L 81,25"
          stroke="url(#metallicGradient)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* High heel thin spike */}
        <path
          d="M 117.5,16.5 L 115.5,25.5"
          stroke="url(#metallicGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Cursive text rendering */}
        <text
          x="120"
          y="50"
          textAnchor="middle"
          fontFamily="'Playfair Display', 'Georgia', 'Great Vibes', 'Brush Script MT', cursive, serif"
          fontWeight="600"
          fontSize="36"
          fill="url(#metallicGradient)"
          letterSpacing="-0.5"
          className="italic"
        >
          Comfort Steps
        </text>

        {/* Spaced-out Luxury Subtitle */}
        <text
          x="120"
          y="72"
          textAnchor="middle"
          fontFamily="'Inter', 'Space Grotesk', sans-serif"
          fontWeight="500"
          fontSize="9"
          fill="#6B7280"
          letterSpacing="5"
          className="uppercase tracking-widest"
        >
          women footweare
        </text>

        {/* Metallic / Chrome Silver Shaded Gradient Definitions */}
        <defs>
          <linearGradient id="metallicGradient" x1="0" y1="0" x2="240" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#111827" /> {/* Dark Slate */}
            <stop offset="30%" stopColor="#374151" /> {/* Charcoal */}
            <stop offset="50%" stopColor="#4B5563" /> {/* Medium Gray */}
            <stop offset="65%" stopColor="#1F2937" /> {/* Deep Metallic */}
            <stop offset="85%" stopColor="#374151" /> {/* Silver Accent */}
            <stop offset="100%" stopColor="#111827" /> {/* Dark Slate Finish */}
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
