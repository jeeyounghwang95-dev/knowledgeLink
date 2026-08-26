import { useEffect, useState } from 'react';
import { Pipette } from 'lucide-react';

/**
 * 색은 어디서나 `#rrggbb` 문자열 하나로만 오간다.
 * 팔레트 버튼이든 RGB 입력이든 결국 같은 형식을 onChange로 넘긴다.
 */

export type Rgb = { r: number; g: number; b: number };

const clamp255 = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

export const hexToRgb = (hex: string): Rgb => {
    const cleaned = hex.trim().replace(/^#/, '');
    // #abc 같은 3자리 표기도 받아준다.
    const full = cleaned.length === 3
        ? cleaned.split('').map((c) => c + c).join('')
        : cleaned;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return { r: 255, g: 255, b: 255 };
    return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
    };
};

export const rgbToHex = ({ r, g, b }: Rgb) =>
    '#' + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('');

/**
 * 배경이 어두우면 본문 글자색을 밝게 바꿔야 읽힌다.
 * sRGB 상대 휘도(WCAG 정의)를 그대로 쓴다. 0.5 아래면 어두운 색으로 본다.
 */
export const isDarkColor = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const srgb = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    return luminance < 0.5;
};

/** 색상 13계열 × 밝기 5단계. 위쪽이 옅고 아래로 갈수록 진하다. */
const HUES: { name: string; tones: string[] }[] = [
    { name: '회색', tones: ['#f8f9fa', '#e9ecef', '#ced4da', '#868e96', '#343a40'] },
    { name: '빨강', tones: ['#fff5f5', '#ffc9c9', '#ff8787', '#fa5252', '#e03131'] },
    { name: '분홍', tones: ['#fff0f6', '#fcc2d7', '#f783ac', '#e64980', '#c2255c'] },
    { name: '자주', tones: ['#f8f0fc', '#eebefa', '#da77f2', '#be4bdb', '#9c36b5'] },
    { name: '보라', tones: ['#f3f0ff', '#d0bfff', '#9775fa', '#7950f2', '#6741d9'] },
    { name: '남보라', tones: ['#edf2ff', '#bac8ff', '#748ffc', '#4c6ef5', '#3b5bdb'] },
    { name: '파랑', tones: ['#e7f5ff', '#a5d8ff', '#4dabf7', '#228be6', '#1971c2'] },
    { name: '하늘', tones: ['#e3fafc', '#99e9f2', '#3bc9db', '#15aabf', '#0c8599'] },
    { name: '청록', tones: ['#e6fcf5', '#96f2d7', '#38d9a9', '#12b886', '#099268'] },
    { name: '초록', tones: ['#ebfbee', '#b2f2bb', '#69db7c', '#40c057', '#2f9e44'] },
    { name: '연두', tones: ['#f4fce3', '#d8f5a2', '#a9e34b', '#82c91e', '#66a80f'] },
    { name: '노랑', tones: ['#fff9db', '#ffec99', '#ffd43b', '#fab005', '#f08c00'] },
    { name: '주황', tones: ['#fff4e6', '#ffd8a8', '#ffa94d', '#fd7e14', '#e8590c'] },
];

const NEUTRALS = ['#ffffff', '#000000'];

const ColorPalette = ({ value, onChange }: { value: string; onChange: (hex: string) => void }) => {
    const rgb = hexToRgb(value);
    // hex 입력칸은 타이핑 중간 상태(#ff, #ff00 …)를 그대로 보여줘야 해서
    // 확정된 색과 별도로 들고 있는다.
    const [hexDraft, setHexDraft] = useState(value);

    useEffect(() => {
        setHexDraft(value);
    }, [value]);

    const setChannel = (channel: keyof Rgb, raw: string) => {
        // 입력칸을 비웠을 때 0으로 튀지 않도록 빈 문자열은 무시한다.
        if (raw.trim() === '') return;
        const n = Number(raw);
        if (Number.isNaN(n)) return;
        onChange(rgbToHex({ ...rgb, [channel]: clamp255(n) }));
    };

    const commitHex = (raw: string) => {
        setHexDraft(raw);
        const cleaned = raw.trim().replace(/^#/, '');
        if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(cleaned)) {
            onChange(rgbToHex(hexToRgb(cleaned)));
        }
    };

    const Swatch = ({ hex }: { hex: string }) => (
        <button
            type="button"
            onClick={() => onChange(hex)}
            title={hex.toUpperCase()}
            className={`w-full aspect-square rounded-[5px] border transition-transform hover:scale-125 relative ${value.toLowerCase() === hex.toLowerCase()
                ? 'border-blue-500 ring-2 ring-blue-200 scale-110 z-10'
                : 'border-black/10'
                }`}
            style={{ backgroundColor: hex }}
        />
    );

    return (
        <div className="space-y-3">
            {/* 흰색/검정은 계열 격자에 없으니 따로 둔다. */}
            <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-1 w-14 shrink-0">
                    {NEUTRALS.map((hex) => <Swatch key={hex} hex={hex} />)}
                </div>
                <div
                    className="flex-1 h-7 rounded-lg border border-gray-200 flex items-center justify-end px-2"
                    style={{ backgroundColor: value }}
                >
                    <span
                        className="text-[10px] font-black tracking-wider"
                        style={{ color: isDarkColor(value) ? '#ffffff' : '#495057' }}
                    >
                        {value.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* 13계열 × 5단계 격자. 열 개수가 tailwind 기본 grid-cols 범위를 넘어서 인라인으로 준다. */}
            <div
                className="grid gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${HUES.length}, minmax(0, 1fr))` }}
            >
                {[0, 1, 2, 3, 4].map((tone) =>
                    HUES.map((hue) => (
                        <Swatch key={`${hue.name}-${tone}`} hex={hue.tones[tone]} />
                    ))
                )}
            </div>

            {/* RGB 직접 입력 (0–255) */}
            <div className="space-y-2 pt-1">
                {(['r', 'g', 'b'] as const).map((channel) => (
                    <div key={channel} className="flex items-center gap-2">
                        <span className="w-4 text-[11px] font-black text-gray-400 uppercase">{channel}</span>
                        <input
                            type="range"
                            min={0}
                            max={255}
                            value={rgb[channel]}
                            onChange={(e) => setChannel(channel, e.target.value)}
                            className="flex-1 h-1.5 accent-blue-500 cursor-pointer"
                        />
                        <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb[channel]}
                            onChange={(e) => setChannel(channel, e.target.value)}
                            className="w-14 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                ))}

                <div className="flex items-center gap-2 pt-1">
                    <input
                        type="text"
                        value={hexDraft}
                        onChange={(e) => commitHex(e.target.value)}
                        onBlur={() => setHexDraft(value)}
                        spellCheck={false}
                        className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold uppercase focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="#ffffff"
                    />
                    <label
                        className="w-8 h-8 shrink-0 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden"
                        title="스포이드로 고르기"
                    >
                        <Pipette size={14} className="text-gray-500" />
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ColorPalette;
