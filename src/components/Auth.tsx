import { useStore } from '../store/useStore';
import { Layout, Chrome } from 'lucide-react';

const Auth = () => {
    const { signInWithGoogle } = useStore();

    return (
        <div className="flex h-screen bg-white">
            <div className="flex-1 flex flex-col justify-center px-12 md:px-24">
                <div className="max-w-md w-full">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200">
                            <Layout className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">K-Link</h1>
                            <p className="text-[10px] text-blue-500 font-bold tracking-widest uppercase">Knowledge Visualization</p>
                        </div>
                    </div>

                    <h2 className="text-5xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
                        아이디어를 <br />
                        <span className="text-blue-600">입체적</span>으로 시각화하세요.
                    </h2>

                    <p className="text-lg text-gray-500 font-medium mb-12 leading-relaxed">
                        복잡한 생각과 지식을 마인드맵과 순서도로 <br />
                        깔끔하게 정리하고 보관할 수 있습니다.
                    </p>

                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-4 bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-2xl shadow-gray-200 hover:scale-[1.02] active:scale-100"
                    >
                        <Chrome size={24} />
                        Google 계정으로 시작하기
                    </button>

                    <div className="mt-12 flex items-center gap-4 py-8 border-t border-gray-50">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 10}`} alt="avatar" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-gray-400">
                            <span className="text-gray-900 font-black">2,000+</span> 명의 사용자가 선택했습니다
                        </p>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block flex-1 relative bg-gray-50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rotate-12 opacity-30 select-none pointer-events-none">
                    <div className="grid grid-cols-4 gap-8">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                                <div className="w-10 h-1bg-gray-50 rounded-lg mb-4" />
                                <div className="w-full h-2 bg-gray-50 rounded-full mb-2" />
                                <div className="w-2/3 h-2 bg-gray-50 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
