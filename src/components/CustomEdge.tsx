import React from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    getStraightPath,
    getSmoothStepPath,
    type EdgeProps,
    useReactFlow,
} from 'reactflow';
import { Trash2 } from 'lucide-react';

export default function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    data,
}: EdgeProps) {
    const { setEdges } = useReactFlow();

    const params = {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    };

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    const pathType = data?.pathType || 'bezier';

    switch (pathType) {
        case 'straight':
            [edgePath, labelX, labelY] = getStraightPath(params);
            break;
        case 'step':
            [edgePath, labelX, labelY] = getSmoothStepPath({ ...params, borderRadius: 10 });
            break;
        default:
            [edgePath, labelX, labelY] = getBezierPath(params);
    }

    const onEdgeClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        setEdges((edges) => edges.filter((edge) => edge.id !== id));
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{
                ...style,
                strokeWidth: selected ? 3 : 2,
                stroke: selected ? '#3b82f6' : (style.stroke || '#b1b1b7'),
                transition: 'all 0.2s',
            }} />
            <EdgeLabelRenderer>
                {selected && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <button
                            className="w-8 h-8 bg-white border border-red-100 rounded-full shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all pointer-events-auto"
                            onClick={onEdgeClick}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
}
