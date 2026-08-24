import { useState, useEffect, useRef } from 'react';
import { useStore, TRASH_RETENTION_DAYS, trashDaysLeft } from '../store/useStore';
import {
    FolderPlus, FilePlus, ChevronRight, Folder, FileText, LogOut, Layout,
    MoreVertical, Pencil, Trash2, RotateCcw, AlertTriangle,
} from 'lucide-react';

const Dashboard = ({ onSelectMindmap }: { onSelectMindmap: (id: string) => void }) => {
    const {
        user, signOut, folders, mindmaps, trashedMindmaps,
        fetchFolders, fetchMindmaps, createMindmap,
        renameMindmap, trashMindmap, restoreMindmap, deleteMindmapForever,
        fetchTrash, purgeExpiredTrash,
    } = useStore();
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [showTrash, setShowTrash] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchFolders();
        // 보관 기간이 지난 항목을 먼저 치우고 나서 휴지통을 읽어야
        // 이미 만료된 항목이 잠깐 보였다 사라지지 않는다.
        purgeExpiredTrash().then(fetchTrash);
    }, []);

    useEffect(() => {
        if (!showTrash) fetchMindmaps(selectedFolderId);
    }, [selectedFolderId, showTrash]);

    // 카드 바깥을 누르면 열려 있던 메뉴를 닫는다.
    useEffect(() => {
        if (!menuOpenId) return;
        const onPointerDown = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpenId(null);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [menuOpenId]);

    const handleCreateFolder = async () => {
        const name = prompt('폴더 이름을 입력하세요:');
        if (!name) return;
        // In a real app, you'd insert this into Supabase 'folders' table then re-fetch
        // For brevity, I'll focus on the UI flow.
        alert('폴더 생성 기능은 테넌트 권한에 따라 구현됩니다.');
    };

    const handleCreateMindmap = async () => {
        const title = prompt('마인드맵 제목을 입력하세요:')?.trim();
        if (!title) return;

        // createMindmap은 항상 새 행을 만든다. 편집 중이던 마인드맵을
        // 덮어쓰지 않도록 saveMindmap과 분리되어 있다.
        const id = await createMindmap(title, selectedFolderId);
        if (!id) {
            alert('프로젝트를 만들지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
            return;
        }
        await fetchMindmaps(selectedFolderId);
    };

    const handleRename = async (map: any) => {
        setMenuOpenId(null);
        const title = prompt('새 이름을 입력하세요:', map.title)?.trim();
        if (!title || title === map.title) return;

        if (!await renameMindmap(map.id, title)) {
            alert('이름을 바꾸지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
        }
    };

    const handleTrash = async (map: any) => {
        setMenuOpenId(null);
        const ok = confirm(
            `'${map.title}'을(를) 휴지통으로 옮길까요?\n\n` +
            `${TRASH_RETENTION_DAYS}일 동안 보관되며, 그 전에는 언제든 복원할 수 있습니다.`
        );
        if (!ok) return;

        if (await trashMindmap(map.id)) await fetchTrash();
        else alert('휴지통으로 옮기지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
    };

    const handleRestore = async (map: any) => {
        if (!await restoreMindmap(map.id)) {
            alert('복원하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
            return;
        }
        // 복원된 맵이 지금 보고 있는 공간에 속할 수 있으니 목록을 다시 읽는다.
        await fetchMindmaps(selectedFolderId);
    };

    const handleDeleteForever = async (map: any) => {
        const ok = confirm(
            `'${map.title}'을(를) 영구 삭제할까요?\n\n이 작업은 되돌릴 수 없습니다.`
        );
        if (!ok) return;

        if (!await deleteMindmapForever(map.id)) {
            alert('삭제하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
        }
    };

    const headerTitle = showTrash
        ? '휴지통'
        : selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : '전체 마인드맵';

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-sm">
                <div className="p-8 flex items-center gap-3 border-b border-gray-50">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                        <Layout className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="font-black text-xl text-gray-900 tracking-tight">K-Link</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Dashboard</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <button
                        onClick={() => { setShowTrash(false); setSelectedFolderId(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${!showTrash && selectedFolderId === null
                                ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Layout size={18} />
                        메인 공간
                    </button>

                    <div className="pt-4 pb-2 px-4">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">폴더</p>
                    </div>

                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => { setShowTrash(false); setSelectedFolderId(folder.id); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${!showTrash && selectedFolderId === folder.id
                                    ? 'bg-blue-50 text-blue-600 font-bold'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Folder size={18} />
                            <span className="truncate">{folder.name}</span>
                        </button>
                    ))}

                    <button
                        onClick={handleCreateFolder}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-blue-500 rounded-xl transition-all group border border-dashed border-transparent hover:border-blue-100 mt-4"
                    >
                        <FolderPlus size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">새 폴더 추가</span>
                    </button>

                    <div className="pt-6 pb-2 px-4">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">기타</p>
                    </div>

                    <button
                        onClick={() => { setShowTrash(true); fetchTrash(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${showTrash
                                ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Trash2 size={18} />
                        <span className="flex-1 text-left">휴지통</span>
                        {trashedMindmaps.length > 0 && (
                            <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                {trashedMindmaps.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* User Profile */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.user_metadata.avatar_url}
                            alt="avatar"
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.user_metadata.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                    >
                        <LogOut size={14} />
                        로그아웃
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white border-b border-gray-50 flex items-center justify-between px-10">
                    <h2 className="text-xl font-black text-gray-900">{headerTitle}</h2>
                    {!showTrash && (
                        <button
                            onClick={handleCreateMindmap}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-100"
                        >
                            <FilePlus size={18} />
                            새 프로젝트 만들기
                        </button>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto p-10">
                    {showTrash && trashedMindmaps.length > 0 && (
                        <div className="mb-8 flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-700 px-5 py-4 rounded-2xl">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">
                                휴지통의 항목은 {TRASH_RETENTION_DAYS}일이 지나면 자동으로 영구 삭제됩니다.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {!showTrash && mindmaps.map(map => (
                            <div
                                key={map.id}
                                onClick={() => onSelectMindmap(map.id)}
                                className="group relative bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer flex flex-col h-48"
                            >
                                {/* 카드 메뉴. 카드 자체의 열기 동작과 겹치지 않게 이벤트를 막는다. */}
                                <div
                                    ref={menuOpenId === map.id ? menuRef : undefined}
                                    className="absolute top-4 right-4"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => setMenuOpenId(menuOpenId === map.id ? null : map.id)}
                                        className={`p-1.5 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-all ${menuOpenId === map.id ? 'bg-gray-100 text-gray-600' : 'opacity-0 group-hover:opacity-100'
                                            }`}
                                        title="더보기"
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {menuOpenId === map.id && (
                                        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-20">
                                            <button
                                                onClick={() => handleRename(map)}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                            >
                                                <Pencil size={14} />
                                                이름 바꾸기
                                            </button>
                                            <button
                                                onClick={() => handleTrash(map)}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                휴지통으로 이동
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                    <FileText size={24} className="text-blue-500 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-1 truncate pr-8">{map.title}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">마지막 수정: {new Date(map.updated_at).toLocaleDateString()}</p>
                                <div className="mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-blue-500 font-black">프로젝트 열기</span>
                                    <ChevronRight size={14} className="text-blue-500 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}

                        {showTrash && trashedMindmaps.map(map => {
                            const daysLeft = trashDaysLeft(map.deleted_at);
                            return (
                                <div
                                    key={map.id}
                                    className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col h-48"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                            <FileText size={24} className="text-gray-400" />
                                        </div>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${daysLeft <= 3 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {daysLeft > 0 ? `${daysLeft}일 남음` : '곧 삭제됨'}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-gray-500 mb-1 truncate">{map.title}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                                        삭제: {new Date(map.deleted_at).toLocaleDateString()}
                                    </p>
                                    <div className="mt-auto flex items-center gap-2">
                                        <button
                                            onClick={() => handleRestore(map)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                                        >
                                            <RotateCcw size={13} />
                                            복원
                                        </button>
                                        <button
                                            onClick={() => handleDeleteForever(map)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                                        >
                                            <Trash2 size={13} />
                                            영구 삭제
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {!showTrash && mindmaps.length === 0 && (
                            <div className="col-span-full h-96 flex flex-col items-center justify-center text-center opacity-50">
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                                    <FileText size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">저장된 프로젝트가 없습니다</h3>
                                <p className="text-gray-400 max-w-xs font-medium">새로운 마인드맵을 생성하여 아이디어를 정리해 보세요!</p>
                            </div>
                        )}

                        {showTrash && trashedMindmaps.length === 0 && (
                            <div className="col-span-full h-96 flex flex-col items-center justify-center text-center opacity-50">
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                                    <Trash2 size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">휴지통이 비어 있습니다</h3>
                                <p className="text-gray-400 max-w-xs font-medium">삭제한 프로젝트는 {TRASH_RETENTION_DAYS}일 동안 이곳에 보관됩니다.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
