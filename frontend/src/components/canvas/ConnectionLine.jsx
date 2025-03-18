import React from 'react';
import { getSmoothStepPath } from 'reactflow';

export default function ConnectionLine({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="#6366F1"
        strokeWidth={2}
        strokeDasharray="5,5"
        className="animate-dash"
      />
      <circle
        cx={toX}
        cy={toY}
        r={4}
        fill="#6366F1"
        className="animate-pulse"
      />
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </>
  );
} 