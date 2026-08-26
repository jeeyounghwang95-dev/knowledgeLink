import { useEffect, useState } from 'react';
import type { Node } from 'reactflow';
import { Type, Palette, Link2, Trash2, Settings2, FileText, AlignLeft, AlignCenter, AlignRight, Maximize2, RotateCcw } from 'lucide-react';
import { useStore, type NodeData } from '../store/useStore';
import ColorPalette from './ColorPalette';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
    toolbar: [
        ['bold'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ],
};

const NodeSettings = ({ selectedNode }: { selectedNode: Node<NodeData> | null }) => {
    const { updateNode, setNodeSize, resetNodeSize, onNodesChange, isEditMode, appMode } = useStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [color, setColor] = useState('');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [lastNodeId, setLastNodeId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedNode && selectedNode.id !== lastNodeId) {
            setTitle(selectedNode.data.title);
            setContent(selectedNode.data.content);
            setUrl(selectedNode.data.url || '');
            setColor(selectedNode.data.color);
            setTextAlign(selectedNode.data.textAlign || 'center');
            setLastNodeId(selectedNode.id);
        }
    }, [selectedNode, lastNodeId]);

    if (!selectedNode || !isEditMode) return null;

    const handleUpdate = (field: keyof NodeData, value: any) => {
        updateNode(selectedNode.id, { [field]: value });
    };


    // 표시값은 스토어를 그대로 따라간다. 그래야 모서리를 끌어 크기를 바꾸는
    // 동안에도 입력칸 숫자가 같이 움직인다.
    const width = selectedNode.data.width ?? Math.round(selectedNode.width ?? 0);
    const height = selectedNode.data.height ?? Math.round(selectedNode.height ?? 0);
    const hasFixedSize = selectedNode.data.width !== undefined || selectedNode.data.height !== undefined;

    const handleSize = (axis: 'width' | 'height', raw: string) => {
        // 지우는 중(빈 칸)에는 0으로 찌그러뜨리지 않는다.
        if (raw.trim() === '') return;
        const n = Number(raw);
        if (Number.isNaN(n)) return;
        setNodeSize(selectedNode.id, { [axis]: Math.max(axis === 'width' ? 120 : 60, Math.round(n)) });
    };

    const handleDelete = () => {
        onNodesChange([{ type: 'remove', id: selectedNode.id }]);
    };

    return (
        <div className="fixed right-6 top-24 z-50 w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl p-6 transition-all animate-in fade-in slide-in-from-right-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Settings2 size={18} className="text-blue-500" />
                    노드 상세 설정
                </h3>
            </div>

            <div className="space-y-6">
                {/* Title - Only if mindmap mode and rectangle */}
                {(appMode === 'mindmap' && selectedNode.data.shape === 'rectangle') && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Type size={14} />
                            제목
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                handleUpdate('title', e.target.value);
                            }}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                            placeholder="제목을 입력하세요"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} />
                        내용 (Rich Text)
                    </label>
                    <div className="sidebar-quill">
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={(val) => {
                                setContent(val);
                                handleUpdate('content', val);
                            }}
                            modules={modules}
                            className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                        />
                    </div>
                </div>

                {/* Node Size */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Maximize2 size={14} />
                        노드 크기
                    </label>
                    <div className="flex items-center gap-2">
                        {([['width', '너비'], ['height', '높이']] as const).map(([axis, label]) => (
                            <div
                                key={axis}
                                className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-400 transition-all"
                            >
                                <span className="text-[10px] font-black text-gray-400 shrink-0">{label}</span>
                                <input
                                    type="number"
                                    min={axis === 'width' ? 120 : 60}
                                    step={10}
                                    value={axis === 'width' ? width : height}
                                    onChange={(e) => handleSize(axis, e.target.value)}
                                    className="w-full min-w-0 bg-transparent text-sm font-bold text-gray-700 focus:outline-none"
                                />
                                <span className="text-[10px] font-bold text-gray-300 shrink-0">px</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => resetNodeSize(selectedNode.id)}
                        disabled={!hasFixedSize}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-100 transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                        <RotateCcw size={13} />
                        내용에 맞춰 자동 크기
                    </button>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                        캔버스에서 노드 모서리를 끌어도 크기가 바뀝니다. 본문은 노드 너비에 맞춰 자동으로 줄바꿈됩니다.
                    </p>
                </div>

                {/* Text Alignment */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <AlignLeft size={14} />
                        텍스트 정렬
                    </label>
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                        {(['left', 'center', 'right'] as const).map((align) => (
                            <button
                                key={align}
                                onClick={() => {
                                    setTextAlign(align);
                                    handleUpdate('textAlign', align);
                                }}
                                className={cn(
                                    "flex-1 py-2 flex items-center justify-center rounded-lg transition-all",
                                    textAlign === align ? "bg-white shadow-sm text-blue-500" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {align === 'left' && <AlignLeft size={16} />}
                                {align === 'center' && <AlignCenter size={16} />}
                                {align === 'right' && <AlignRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* URL */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Link2 size={14} />
                        참조 링크
                    </label>
                    <input
                        type="text"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            handleUpdate('url', e.target.value);
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                    />
                </div>

                {/* Color Palette */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Palette size={14} />
                        배경 색상
                    </label>
                    <ColorPalette
                        value={color || '#ffffff'}
                        onChange={(hex) => {
                            setColor(hex);
                            handleUpdate('color', hex);
                        }}
                    />
                </div>

                {/* Delete Action */}
                <div className="pt-6 border-t border-gray-100">
                    <button
                        onClick={handleDelete}
                        className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-bold border border-transparent hover:border-red-100"
                    >
                        <Trash2 size={16} />
                        노드 삭제
                    </button>
                </div>
            </div>
        </div>
    );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export default NodeSettings;
