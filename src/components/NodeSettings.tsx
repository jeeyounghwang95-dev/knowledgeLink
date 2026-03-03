import { useEffect, useState } from 'react';
import type { Node } from 'reactflow';
import { Type, Palette, Link2, Trash2, Settings2, FileText, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useStore, type NodeData } from '../store/useStore';
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
    const { updateNode, onNodesChange, isEditMode, appMode } = useStore();
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


    const colors = [
        { name: 'White', value: '#ffffff' },
        { name: 'Yellow', value: '#fff9db' },
        { name: 'Red', value: '#fff5f5' },
        { name: 'Green', value: '#f1fbee' },
        { name: 'Blue', value: '#e7f5ff' },
        { name: 'Purple', value: '#f3f0ff' },
    ];

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
                    <div className="flex gap-2 flex-wrap">
                        {colors.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => {
                                    setColor(c.value);
                                    handleUpdate('color', c.value);
                                }}
                                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${color === c.value ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100'
                                    }`}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                            />
                        ))}
                    </div>
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
