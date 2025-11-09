
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeIngredients, analyzeBarcode } from '../services/geminiService';
import { advancedImageProcessing, loadCv, encodeImageAsBase64 } from '../services/cvService';
import { AnalysisResponse, ECodeStatus, IdentifierMode } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CameraIcon } from './icons/CameraIcon';
import { BarcodeScannerIcon } from './icons/BarcodeScannerIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

declare global {
    interface Window {
        Html5Qrcode: any;
    }
}

const StatusInfo: React.FC<{ status: ECodeStatus }> = ({ status }) => {
    const statusConfig = {
        [ECodeStatus.Halal]: {
            icon: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
            textClass: 'text-emerald-300',
            bgClass: 'bg-emerald-500/20',
            label: 'Halal',
        },
        [ECodeStatus.Haram]: {
            icon: <XCircleIcon className="w-5 h-5 text-red-400" />,
            textClass: 'text-red-300',
            bgClass: 'bg-red-500/20',
            label: 'Haram',
        },
        [ECodeStatus.Mushbooh]: {
            icon: <QuestionMarkCircleIcon className="w-5 h-5 text-amber-400" />,
            textClass: 'text-amber-300',
            bgClass: 'bg-amber-500/20',
            label: 'Mushbooh',
        },
    };

    const config = statusConfig[status];

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
            {config.icon}
            <span>{config.label}</span>
        </div>
    );
};

const HalalIdentifier: React.FC = () => {
    const [mode, setMode] = useState<IdentifierMode>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCvLoading, setIsCvLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
    const [results, setResults] = useState<AnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const html5QrCodeRef = useRef<any>(null);
    const isBarcodeProcessing = useRef(false);
    const scannerRegionId = 'reader';

    useEffect(() => {
        loadCv()
            .then(() => setIsCvLoading(false))
            .catch(err => {
                console.error("Failed to load OpenCV", err);
                setError("Failed to initialize computer vision tools. Please refresh the page.");
                setIsCvLoading(false);
            });
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    }, []);
    
    const stopBarcodeScanner = useCallback(() => {
        if (html5QrCodeRef.current?.isScanning) {
            return html5QrCodeRef.current.stop().catch((err: any) => {
                console.error("Failed to stop barcode scanner.", err);
            });
        }
        return Promise.resolve();
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
            stopBarcodeScanner();
        };
    }, [stopCamera, stopBarcodeScanner]);

    const startCamera = useCallback(async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOn(true);
            }
        } catch (err: any) {
            let message = "Could not start camera. Please grant permission and ensure it's not in use by another app.";
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = "Camera permission was denied. You must grant permission in your browser settings to use this feature.";
            }
            setError(message);
            setIsCameraOn(false);
            setMode('upload');
        }
    }, []);
    
    const handleAnalyzeBarcode = useCallback(async (barcodeData: string) => {
        setLoadingMessage(`Looking up barcode: ${barcodeData}...`);
        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const analysisResults = await analyzeBarcode(barcodeData);
            setResults(analysisResults);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
            setMode('upload');
            isBarcodeProcessing.current = false;
        }
    }, []);
    
    const startBarcodeScanner = useCallback(() => {
        setError(null);
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new window.Html5Qrcode(scannerRegionId);
        }

        const onScanSuccess = async (decodedText: string) => {
            if (isBarcodeProcessing.current) return;
            isBarcodeProcessing.current = true;
            try {
                await stopBarcodeScanner();
                handleAnalyzeBarcode(decodedText);
            } catch (e) {
                console.error("Error during barcode scan success handling:", e);
                isBarcodeProcessing.current = false;
            }
        };
        
        const onScanFailure = (error: any) => { /* ignore */ };

        html5QrCodeRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({ width: Math.min(viewfinderWidth, viewfinderHeight) * 0.7, height: Math.min(viewfinderWidth, viewfinderHeight) * 0.7 }) },
            onScanSuccess,
            onScanFailure
        ).catch(() => {
            setError("Failed to start barcode scanner. Please grant camera permission.");
            setMode('upload');
        });
    }, [stopBarcodeScanner, handleAnalyzeBarcode]);


    const handleModeChange = (newMode: IdentifierMode) => {
        // Reset state
        setImageFile(null);
        setImageUrl(null);
        setIsLoading(false);
        setResults(null);
        setError(null);
        isBarcodeProcessing.current = false;

        // Stop any active devices
        if (isCameraOn) stopCamera();
        stopBarcodeScanner();
        
        setMode(newMode);

        if (newMode === 'capture') {
            startCamera();
        } else if (newMode === 'barcode') {
            // Delay to allow UI to render the scanner region
            setTimeout(() => startBarcodeScanner(), 100);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
            setResults(null);
            setError(null);
        }
    };

    const handleAnalyzeImage = useCallback(async () => {
        if (!imageFile) return;
        
        setLoadingMessage('Preprocessing & Analyzing...');
        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            // Generate both the processed and original image strings in parallel
            const [base64ProcessedString, base64OriginalString] = await Promise.all([
                advancedImageProcessing(imageFile),
                encodeImageAsBase64(imageFile)
            ]);

            setLoadingMessage('Analyzing Ingredients & Logo...');
            const analysisResults = await analyzeIngredients(base64ProcessedString, base64OriginalString);
            setResults(analysisResults);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile]);

    const handleCaptureImage = useCallback(() => {
        if (videoRef.current && isCameraOn) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas'); // Use a temporary canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) {
                setError("Could not get canvas context to capture image.");
                return;
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    setImageFile(capturedFile);
                    if (imageUrl) URL.revokeObjectURL(imageUrl);
                    setImageUrl(URL.createObjectURL(capturedFile));
                    stopCamera();
                    setMode('upload');
                } else {
                    setError("Failed to create image blob from canvas.");
                }
            }, 'image/jpeg', 0.95);
        }
    }, [isCameraOn, stopCamera, imageUrl]);

    const OverallStatusCard: React.FC<{ status: string }> = ({ status }) => {
        let bgGradient = 'from-zinc-900 to-black';
        let textColor = 'text-zinc-100';
        let icon = <SparklesIcon className="w-8 h-8 text-fuchsia-400" />;

        if (status.toLowerCase().includes('haram')) {
            bgGradient = 'from-red-500/20 to-black/20';
            textColor = 'text-red-300';
            icon = <XCircleIcon className="w-8 h-8 text-red-400" />;
        } else if (status.toLowerCase().includes('doubtful')) {
            bgGradient = 'from-amber-500/20 to-black/20';
            textColor = 'text-amber-300';
            icon = <QuestionMarkCircleIcon className="w-8 h-8 text-amber-400" />;
        } else if (status.toLowerCase().includes('halal')) {
            bgGradient = 'from-emerald-500/20 to-black/20';
            textColor = 'text-emerald-300';
            icon = <CheckCircleIcon className="w-8 h-8 text-emerald-400" />;
        }

        return (
            <div className={`p-6 rounded-lg bg-gradient-to-br ${bgGradient} flex flex-col md:flex-row items-center gap-4 border border-zinc-800`}>
                {icon}
                <div className="text-center md:text-left">
                    <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Overall Status</h3>
                    <p className={`text-2xl font-bold ${textColor}`}>{status}</p>
                </div>
            </div>
        );
    };

    const renderCameraCapture = () => (
        <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-sm bg-black rounded-lg overflow-hidden border border-zinc-800 min-h-[282px] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto" style={{ display: isCameraOn ? 'block' : 'none' }}></video>
                {!isCameraOn && !error && (
                    <div className="text-center p-4">
                        <svg className="animate-spin h-8 w-8 text-emerald-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="font-semibold text-zinc-300">Initializing Camera...</p>
                    </div>
                )}
            </div>
            <button onClick={handleCaptureImage} disabled={!isCameraOn || isLoading || isCvLoading} className="relative w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-zinc-800 disabled:to-zinc-900 disabled:cursor-not-allowed transition-all overflow-hidden group">
                <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                <CameraIcon className="w-5 h-5"/> Capture Image
            </button>
        </div>
    );
    
    const renderBarcodeScanner = () => (
        <div className="flex flex-col items-center gap-4">
             <div className="w-full max-w-sm bg-black rounded-lg overflow-hidden border border-zinc-800 aspect-square" id={scannerRegionId}></div>
             <p className="text-zinc-400 text-sm">Point your camera at a barcode.</p>
        </div>
    );
    
    const ModeButton: React.FC<{ current: IdentifierMode; target: IdentifierMode; onClick: (mode: IdentifierMode) => void; icon: React.ReactNode; label: string; }> = ({ current, target, onClick, icon, label }) => (
        <button onClick={() => onClick(target)} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition ${current === target ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
            {icon} {label}
        </button>
    );

    return (
        <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col gap-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">Check Product Status</h2>
                <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">Upload an image, take a photo, or scan a barcode to check its Halal status instantly.</p>
            </div>
            
             { !isLoading && (
            <div className="bg-zinc-900/50 p-6 rounded-xl shadow-2xl border border-zinc-800">
                <div className="flex justify-center mb-6">
                    <div className="bg-black/50 border border-zinc-800 rounded-full p-1 flex flex-wrap justify-center gap-1">
                        <ModeButton current={mode} target="upload" onClick={handleModeChange} icon={<UploadIcon className="w-5 h-5"/>} label="Upload" />
                        <ModeButton current={mode} target="capture" onClick={handleModeChange} icon={<CameraIcon className="w-5 h-5"/>} label="Photo" />
                        <ModeButton current={mode} target="barcode" onClick={handleModeChange} icon={<BarcodeScannerIcon className="w-5 h-5"/>} label="Barcode" />
                    </div>
                </div>

                {mode === 'upload' && (
                     <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-full md:w-2/5">
                            <label htmlFor="file-upload" className="group relative block w-full p-4 text-center border border-zinc-800 rounded-lg cursor-pointer bg-black/50 hover:border-emerald-500 hover:bg-zinc-900/50 transition-all duration-300">
                                <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-emerald-500/50 transition-all duration-300 animate-pulse-slow"></div>
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Ingredient list preview" className="mx-auto max-h-40 rounded-md object-contain" />
                                ) : (
                                    <div className="py-6">
                                        <UploadIcon className="mx-auto h-12 w-12 text-zinc-500 group-hover:text-emerald-500 transition-colors duration-300" />
                                        <span className="mt-2 block text-sm font-semibold text-zinc-300">Click to upload</span>
                                        <span className="mt-1 block text-xs text-zinc-500">PNG, JPG, up to 10MB</span>
                                    </div>
                                )}
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>
                        <div className="w-full md:w-3/5 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                            <p className="text-zinc-400 mb-4">{isCvLoading ? "Initializing CV tools..." : "Select an image, then click below."}</p>
                            <button onClick={handleAnalyzeImage} disabled={!imageFile || isLoading || isCvLoading} className="relative w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-emerald-500 disabled:from-zinc-800 disabled:to-zinc-900 disabled:cursor-not-allowed transition-all overflow-hidden group">
                                <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                                <SparklesIcon className="w-5 h-5"/> Analyze Image
                            </button>
                        </div>
                    </div>
                )}
                
                {mode === 'capture' && renderCameraCapture()}
                {mode === 'barcode' && renderBarcodeScanner()}
            </div>
             )}

            {isLoading && (
                 <div className="text-center p-8 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <svg className="animate-spin h-10 w-10 text-emerald-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="font-semibold text-lg text-zinc-200">{loadingMessage}</p>
                    <p className="text-zinc-400 text-sm mt-1">AI is working its magic. This may take a moment...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-900/50 text-red-300 p-4 rounded-md border border-red-500/30 flex items-center gap-3">
                    <XCircleIcon className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <p className="font-bold">An Error Occurred</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}
            
            {results && (
                <div className="space-y-6 animate-fade-in">
                    <OverallStatusCard status={results.overallStatus} />

                    {typeof results.halalLogoDetected === 'boolean' && mode !== 'barcode' && (
                        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${results.halalLogoDetected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'}`}>
                            {results.halalLogoDetected ? <CheckCircleIcon className="w-5 h-5" /> : <InformationCircleIcon className="w-5 h-5" />}
                            <span className="text-sm font-medium">{results.halalLogoDetected ? 'Official Halal Logo Detected' : 'No Halal Logo Detected'}</span>
                        </div>
                    )}

                    <div className="bg-zinc-900/50 p-6 rounded-xl shadow-2xl border border-zinc-800">
                      <h3 className="text-xl font-bold mb-4 text-white">Ingredient Breakdown</h3>
                      <div className="flow-root">
                          <div className="-my-4 divide-y divide-zinc-800">
                          {results.ingredients.map((item, index) => {
                                let borderColor = 'border-zinc-700';
                                if (item.status === ECodeStatus.Halal) borderColor = 'border-emerald-500/50';
                                if (item.status === ECodeStatus.Haram) borderColor = 'border-red-500/50';
                                if (item.status === ECodeStatus.Mushbooh) borderColor = 'border-amber-500/50';

                              return (
                              <div key={index} className={`py-4 border-l-4 ${borderColor} pl-4`}>
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                      <p className="text-lg font-semibold text-zinc-100">{item.name}</p>
                                      <StatusInfo status={item.status} />
                                  </div>
                                  <p className="mt-2 text-zinc-400 text-sm">{item.reason}</p>
                              </div>
                              );
                          })}
                          </div>
                      </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HalalIdentifier;