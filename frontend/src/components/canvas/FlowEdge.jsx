import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';

// Custom animated edge component
export default function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Custom animated edge styling
  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#64748b',
          strokeDasharray: 10,
          animation: 'flowAnimation 30s infinite linear',
        }}
        className="react-flow__edge-path transition-all duration-300 hover:stroke-blue-500 hover:stroke-[3px]"
      />
      <style jsx global>{`
        @keyframes flowAnimation {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -1000; /* Adjust based on your preference */
          }
        }
      `}</style>
    </>
  );
} 