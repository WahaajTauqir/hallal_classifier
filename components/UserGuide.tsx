
import React from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { CameraIcon } from './icons/CameraIcon';
import { BarcodeScannerIcon } from './icons/BarcodeScannerIcon';

const GuideStep: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="flex flex-col sm:flex-row items-start gap-6 bg-zinc-900/50 p-6 rounded-xl shadow-lg border border-zinc-800 transition-all hover:border-emerald-500/50 hover:bg-zinc-900">
    <div className="flex-shrink-0 bg-gradient-to-br from-zinc-800 to-zinc-900 text-emerald-400 rounded-full p-4 border border-zinc-700">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-zinc-400">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  </div>
);


const UserGuide: React.FC = () => {
    return (
        <div className="w-full max-w-4xl mx-auto flex-grow">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">User Guide</h2>
                <p className="mt-4 text-lg text-zinc-400">Learn how to use the Halal Identifier app effectively.</p>
            </div>
            <div className="space-y-8">
                <GuideStep
                    icon={<UploadIcon className="w-8 h-8" />}
                    title="Option 1: Upload an Image"
                    description="Navigate to the 'Identifier' tab and select 'Upload'. Click the upload area and select a clear photo of the product's ingredient list."
                >
                    <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                        <p className="font-semibold text-zinc-200">Pro Tip:</p>
                        <ul className="list-disc list-inside text-zinc-400 text-sm mt-1 space-y-1">
                            <li>Ensure the text is readable and not blurry.</li>
                            <li>Avoid shadows or glare on the ingredient list.</li>
                            <li>Crop the image to focus only on the relevant text area.</li>
                        </ul>
                    </div>
                </GuideStep>

                <GuideStep
                    icon={<CameraIcon className="w-8 h-8" />}
                    title="Option 2: Take a Photo"
                    description="On the 'Identifier' tab, select 'Photo'. Grant camera permission if prompted. Point your camera at the product's ingredient list and tap the 'Capture Image' button."
                >
                     <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                        <p className="font-semibold text-zinc-200">Photo Tips:</p>
                        <ul className="list-disc list-inside text-zinc-400 text-sm mt-1 space-y-1">
                            <li>Ensure good lighting conditions.</li>
                            <li>Hold your device steady to avoid a blurry photo.</li>
                            <li>Make sure the entire ingredient list is visible in the frame before capturing.</li>
                        </ul>
                    </div>
                </GuideStep>

                 <GuideStep
                    icon={<BarcodeScannerIcon className="w-8 h-8" />}
                    title="Option 3: Scan a Barcode"
                    description="Select 'Barcode' on the 'Identifier' tab. Point your camera at the product's barcode. The app will automatically detect it, look up the product, and begin the analysis."
                >
                     <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                        <p className="font-semibold text-zinc-200">Scanning Tips:</p>
                        <ul className="list-disc list-inside text-zinc-400 text-sm mt-1 space-y-1">
                            <li>Ensure the entire barcode is visible within the camera view.</li>
                            <li>Hold your device steady and avoid reflections on the barcode.</li>
                            <li>If the scanner has trouble, try adjusting the distance and angle.</li>
                        </ul>
                    </div>
                </GuideStep>

                <GuideStep
                    icon={<SparklesIcon className="w-8 h-8" />}
                    title="Analyze the Data"
                    description="After providing an image or barcode, click 'Analyze Ingredients' (if you uploaded an image). The AI will then process the data. Analysis starts automatically for photo capture and barcode scans."
                >
                    <div className="p-4 bg-black/50 rounded-lg border border-zinc-800 text-center">
                        <p className="text-zinc-300">Please be patient, this may take a few moments.</p>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-zinc-400 text-sm">Processing...</span>
                        </div>
                    </div>
                </GuideStep>

                <GuideStep
                    icon={<CheckCircleIcon className="w-8 h-8" />}
                    title="Review the Results"
                    description="The AI will provide an overall status for the product and a detailed breakdown of each identified ingredient. Results are color-coded for clarity:"
                >
                     <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-3 p-2 bg-black/50 rounded-md"><div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-400/50 flex-shrink-0"></div><span className="text-zinc-300">Halal: Permissible to consume.</span></div>
                        <div className="flex items-center gap-3 p-2 bg-black/50 rounded-md"><div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-400/50 flex-shrink-0"></div><span className="text-zinc-300">Mushbooh: Doubtful or questionable origin.</span></div>
                        <div className="flex items-center gap-3 p-2 bg-black/50 rounded-md"><div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-400/50 flex-shrink-0"></div><span className="text-zinc-300">Haram: Forbidden to consume.</span></div>
                        <p className="text-xs text-zinc-500 pt-2">Each doubtful or haram ingredient will include a reason for its classification.</p>
                    </div>
                </GuideStep>

                 <GuideStep
                    icon={<ChatBubbleIcon className="w-8 h-8" />}
                    title="Need More Help? Use the Chatbot"
                    description="If you have any questions about a specific ingredient, E-code, or general Halal topics, navigate to the 'Chatbot' tab. Our AI assistant is there to provide you with instant answers and support."
                />
            </div>
        </div>
    );
};

export default UserGuide;
