
const CACHE_NAME = 'halal-identifier-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/geminiService.ts',
  '/services/cvService.ts',
  '/components/Header.tsx',
  '/components/HalalIdentifier.tsx',
  '/components/Chatbot.tsx',
  '/components/UserGuide.tsx',
  '/components/icons/BookOpenIcon.tsx',
  '/components/icons/ChatBubbleIcon.tsx',
  '/components/icons/CheckCircleIcon.tsx',
  '/components/icons/QuestionMarkCircleIcon.tsx',
  '/components/icons/SparklesIcon.tsx',
  '/components/icons/UploadIcon.tsx',
  '/components/icons/XCircleIcon.tsx',
  '/components/icons/PaperAirplaneIcon.tsx',
  '/components/icons/CameraIcon.tsx',
  '/components/icons/BarcodeScannerIcon.tsx',
  '/components/icons/InformationCircleIcon.tsx',
  '/icon-192.svg',
  '/icon-512.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://aistudiocdn.com/@google/genai@^1.28.0',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://docs.opencv.org/4.9.0/opencv.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});