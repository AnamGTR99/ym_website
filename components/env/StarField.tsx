"use client";

/**
 * CSS-only animated starfield — three parallax layers of stars
 * at different sizes and drift speeds. No canvas, no JS animation loop.
 *
 * Layer 1: tiny distant stars (1px), slow drift
 * Layer 2: medium stars (1.5px), medium drift
 * Layer 3: brighter close stars (2px), faster drift
 */
export default function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="star-layer star-layer-1" />
      <div className="star-layer star-layer-2" />
      <div className="star-layer star-layer-3" />

      <style jsx>{`
        .star-layer {
          position: absolute;
          top: -100%;
          left: 0;
          width: 100%;
          height: 300%;
        }

        .star-layer-1 {
          background-image:
            radial-gradient(1px 1px at 50px 60px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 130px 180px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 210px 40px, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 290px 120px, rgba(255,255,255,0.25), transparent),
            radial-gradient(1px 1px at 370px 200px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 450px 80px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 530px 160px, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 80px 250px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 160px 310px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 400px 290px, rgba(255,255,255,0.25), transparent);
          background-size: 600px 350px;
          animation: star-drift 120s linear infinite;
        }

        .star-layer-2 {
          background-image:
            radial-gradient(1.5px 1.5px at 80px 90px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 200px 50px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1.5px 1.5px at 350px 170px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 480px 110px, rgba(255,255,255,0.35), transparent),
            radial-gradient(1.5px 1.5px at 120px 220px, rgba(255,255,255,0.45), transparent),
            radial-gradient(1.5px 1.5px at 300px 280px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1.5px 1.5px at 520px 30px, rgba(255,255,255,0.3), transparent);
          background-size: 600px 320px;
          animation: star-drift 80s linear infinite;
          animation-delay: -20s;
        }

        .star-layer-3 {
          background-image:
            radial-gradient(2px 2px at 100px 150px, rgba(212,168,83,0.3), transparent),
            radial-gradient(2px 2px at 300px 80px, rgba(255,255,255,0.6), transparent),
            radial-gradient(2px 2px at 500px 200px, rgba(212,168,83,0.25), transparent),
            radial-gradient(1.5px 1.5px at 180px 280px, rgba(255,255,255,0.5), transparent),
            radial-gradient(2px 2px at 420px 320px, rgba(212,168,83,0.2), transparent);
          background-size: 600px 380px;
          animation: star-drift 60s linear infinite;
          animation-delay: -40s;
        }

        @keyframes star-drift {
          from { transform: translateY(0); }
          to { transform: translateY(-33.33%); }
        }
      `}</style>
    </div>
  );
}
