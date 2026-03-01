import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from 'lucide-react';

type AspectOption = {
    label: string;
    value: number | null; // null = livre
};

const ASPECT_OPTIONS: AspectOption[] = [
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '16:9', value: 16 / 9 },
    { label: 'Livre', value: null },
];

interface ImageCropperModalProps {
    imageSrc: string;
    onConfirm: (croppedArea: Area) => Promise<void>;
    onCancel: () => void;
    uploading?: boolean;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
    imageSrc,
    onConfirm,
    onCancel,
    uploading = false,
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [selectedAspect, setSelectedAspect] = useState<number>(1); // 1:1 padrão
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        await onConfirm(croppedAreaPixels);
    };

    const handleZoomIn = () => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)));
    const handleZoomOut = () => setZoom(z => Math.max(1, +(z - 0.1).toFixed(1)));
    const handleRotate = () => setRotation(r => (r + 90) % 360);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={!uploading ? onCancel : undefined}
            />

            {/* Modal */}
            <div className="relative bg-[#0f1b2d] rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] border border-white/10 w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 fade-in duration-200 z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0f3c78] to-[#2f80ed]">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✂️</span>
                        <h3 className="text-white font-black uppercase tracking-wider text-sm">
                            Recortar Foto
                        </h3>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={uploading}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Área de crop */}
                <div className="relative w-full bg-black" style={{ height: 320 }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={selectedAspect}
                        rotation={rotation}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        showGrid
                        style={{
                            containerStyle: { borderRadius: 0 },
                            cropAreaStyle: {
                                border: '2px solid #3b82f6',
                                borderRadius: selectedAspect === 1 ? '50%' : '8px',
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                            },
                        }}
                    />
                </div>

                {/* Controles */}
                <div className="px-5 py-4 space-y-4 bg-[#0f1b2d]">
                    {/* Proporção */}
                    <div>
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">
                            Proporção
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {ASPECT_OPTIONS.map((opt) => {
                                const val = opt.value ?? 1;
                                const isSelected = selectedAspect === val;
                                return (
                                    <button
                                        key={opt.label}
                                        onClick={() => setSelectedAspect(val)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSelected
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Zoom */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                                Zoom
                            </p>
                            <span className="text-blue-400 text-xs font-bold">{zoom.toFixed(1)}×</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleZoomOut}
                                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 accent-blue-500 cursor-pointer h-1.5 rounded-full"
                            />
                            <button
                                onClick={handleZoomIn}
                                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
                            >
                                <ZoomIn size={14} />
                            </button>
                            <button
                                onClick={handleRotate}
                                title="Girar 90°"
                                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onCancel}
                            disabled={uploading}
                            className="flex-1 h-11 rounded-xl border border-white/20 text-white/70 font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={uploading || !croppedAreaPixels}
                            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                            ) : (
                                <><Check size={16} /> Confirmar Corte</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
