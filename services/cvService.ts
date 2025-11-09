// This declaration is needed to inform TypeScript about the global `cv` object
// that will be available once the OpenCV.js script is loaded.
declare global {
    interface Window {
        cv: any;
    }
}

// A simple singleton pattern to ensure we only try to load the script once.
let cvPromise: Promise<void> | null = null;

/**
 * Loads the OpenCV.js library. It returns a promise that resolves when
 * the global `window.cv` object is available.
 * @returns {Promise<void>} A promise that resolves when OpenCV is ready.
 */
export const loadCv = (): Promise<void> => {
    if (window.cv) {
        return Promise.resolve();
    }
    if (cvPromise) {
        return cvPromise;
    }
    cvPromise = new Promise((resolve, reject) => {
        const script = document.querySelector('script[src*="opencv.js"]');
        if (!script) {
            return reject(new Error("OpenCV script tag not found in HTML."));
        }
        
        const checkCv = () => {
            if (window.cv) {
                resolve();
            } else {
                setTimeout(checkCv, 50);
            }
        };

        if (script.hasAttribute('data-loaded')) {
            checkCv();
        } else {
            script.addEventListener('load', () => {
                script.setAttribute('data-loaded', 'true');
                checkCv();
            });
            script.addEventListener('error', () => {
                reject(new Error("Failed to load OpenCV.js script."));
            });
        }
    });
    return cvPromise;
};

/**
 * Encodes an image file into a base64 string without any CV processing.
 * @param {File} file The image file to be encoded.
 * @returns {Promise<string>} A promise that resolves with the base64 encoded string of the image.
 */
export const encodeImageAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


/**
 * Performs advanced image preprocessing using OpenCV.js to enhance an image
 * for better Optical Character Recognition (OCR) by the AI.
 * This pipeline includes:
 * 1. Grayscale Conversion: Simplifies the image, which is a prerequisite for many CV operations.
 * 2. Adaptive Thresholding: A powerful technique that handles uneven lighting and shadows,
 *    making text much clearer than a simple contrast adjustment.
 * 
 * @param {File} file The image file to be processed.
 * @returns {Promise<string>} A promise that resolves with the base64 encoded string of the processed JPEG image.
 */
export const advancedImageProcessing = async (file: File): Promise<string> => {
    await loadCv();
    const cv = window.cv;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            try {
                // Read the image into an OpenCV Mat (Matrix) object
                const src = cv.imread(img);
                const dst = new cv.Mat();
                
                // 1. Convert the image to grayscale
                cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);

                // 2. Apply Adaptive Thresholding.
                // This is highly effective for images with varying illumination.
                // It calculates a threshold for small regions of the image, making it robust against shadows.
                // cv.ADAPTIVE_THRESH_GAUSSIAN_C: Threshold is a weighted sum of neighborhood values.
                // cv.THRESH_BINARY: Pixels brighter than the threshold become white (255), others become black (0).
                // 11: The size of the neighborhood area.
                // 2: A constant subtracted from the mean.
                cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

                // Create a temporary canvas to draw the processed Mat onto
                const canvas = document.createElement('canvas');
                cv.imshow(canvas, dst);

                // Convert the canvas content to a base64 encoded JPEG string
                const base64String = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
                
                // Clean up memory by deleting the Mat objects
                src.delete();
                dst.delete();

                URL.revokeObjectURL(img.src);
                resolve(base64String);

            } catch (error) {
                 URL.revokeObjectURL(img.src);
                reject(error);
            }
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(img.src);
            reject(error);
        };
    });
};