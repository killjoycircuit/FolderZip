// import { useState, FC, ChangeEvent, useEffect } from 'react';
// import { Download, AlertCircle, CheckCircle, Zap, FileText, Folder } from 'lucide-react';
// import JSZip from 'jszip';

// interface TreeItem {
//   name: string;
//   type: 'file' | 'folder';
//   path: string;
//   depth: number;
// }

// interface ParseResult {
//   items: TreeItem[];
//   errors: string[];
//   isValid: boolean;
// }

// const FolderToZip: FC = () => {
//   const [folderStructure, setFolderStructure] = useState<string>(
// `mern-project/
// ├── client/
// │   ├── public/
// │   │   ├── index.html
// │   │   └── favicon.ico
// │   ├── src/
// │   │   ├── assets/
// │   │   ├── components/
// │   │   ├── pages/
// │   │   ├── App.js
// │   │   ├── index.js
// │   │   └── styles/
// │   ├── .env
// │   ├── package.json
// │   └── vite.config.js
// ├── server/
// │   ├── config/
// │   │   └── db.js
// │   ├── controllers/
// │   ├── models/
// │   ├── routes/
// │   ├── middlewares/
// │   ├── app.js
// │   ├── server.js
// │   ├── .env
// │   └── package.json
// ├── .gitignore
// ├── README.md
// └── package.json`);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [parseResult, setParseResult] = useState<ParseResult>({ items: [], errors: [], isValid: false });
//   const [touched, setTouched] = useState<boolean>(false);

//   const sanitizeFileName = (name: string): string => {
//     const invalidChars = /[<>:"|?*\x00-\x1F]/g;
//     const invalidNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com9', 'lpt1', 'lpt9'];
    
//     let sanitized = name.replace(invalidChars, '_').trim();
//     if (sanitized && invalidNames.includes(sanitized.toLowerCase())) {
//       sanitized = '_' + sanitized;
//     }
//     return sanitized || 'unnamed';
//   };

//   const getDepthFromLine = (line: string): number => {
//     let depth = 0;
//     for (let i = 0; i < line.length; i++) {
//       if (line[i] === '│' || line[i] === ' ') {
//         if (i % 4 === 3) depth++;
//       } else {
//         break;
//       }
//     }
//     return depth;
//   };

//   const parseStructure = (): ParseResult => {
//     const lines = folderStructure.split('\n');
//     const newErrors: string[] = [];
//     const items: TreeItem[] = [];
//     const pathStack: Array<{ name: string; depth: number; path: string }> = [];

//     let rootName = '';
//     let hasRoot = false;

//     lines.forEach((line, idx) => {
//       if (!line.trim()) return;

//       const content = line.replace(/[│├──└\s]/g, '').trim();
//       if (!content) return;

//       if (!hasRoot) {
//         rootName = content.replace(/\/$/, '');
//         items.push({
//           name: rootName,
//           type: 'folder',
//           path: rootName,
//           depth: 0
//         });
//         pathStack.push({ name: rootName, depth: 0, path: rootName });
//         hasRoot = true;
//         return;
//       }

//       const depth = getDepthFromLine(line);
//       const hasTreeChar = line.includes('├') || line.includes('└');

//       if (!hasTreeChar) {
//         newErrors.push(`Line ${idx + 1}: Missing tree characters (├── or └──)`);
//         return;
//       }

//       const isFile = content.includes('.');
//       const type: 'file' | 'folder' = isFile ? 'file' : 'folder';

//       while (pathStack.length > 1 && pathStack[pathStack.length - 1].depth >= depth) {
//         pathStack.pop();
//       }

//       const parentPath = pathStack[pathStack.length - 1]?.path || rootName;
//       const sanitized = sanitizeFileName(content);
//       const fullPath = `${parentPath}/${sanitized}`;

//       items.push({
//         name: sanitized,
//         type,
//         path: fullPath,
//         depth
//       });

//       if (!isFile) {
//         pathStack.push({ name: sanitized, depth, path: fullPath });
//       }
//     });

//     const isValid = newErrors.length === 0 && items.length > 1;
//     return { items, errors: newErrors, isValid };
//   };

//   useEffect(() => {
//     const result = parseStructure();
//     setParseResult(result);
//   }, [folderStructure]);

//   const downloadZip = async (): Promise<void> => {
//     if (!parseResult.isValid) return;

//     try {
//       setLoading(true);
//       const zip = new JSZip();
//       const rootName = parseResult.items[0].name;
//       const root = zip.folder(rootName);

//       if (!root) throw new Error('Failed to create root folder');

//       const folderCache: Record<string, any> = {};
//       folderCache[rootName] = root;

//       parseResult.items.slice(1).forEach((item) => {
//         const parts = item.path.split('/');
//         const itemName = parts[parts.length - 1];
//         const parentPath = parts.slice(0, -1).join('/');

//         if (!folderCache[parentPath]) {
//           const pathParts = parentPath.split('/');
//           let currentFolder = zip;
          
//           for (let i = 0; i < pathParts.length; i++) {
//             const folderName = pathParts[i];
//             const fullPath = pathParts.slice(0, i + 1).join('/');
            
//             if (!folderCache[fullPath]) {
//               const newFolder = currentFolder.folder(folderName);
//               if (newFolder) {
//                 folderCache[fullPath] = newFolder;
//                 currentFolder = newFolder;
//               }
//             } else {
//               currentFolder = folderCache[fullPath];
//             }
//           }
//         }

//         const parentFolder = folderCache[parentPath];
//         if (!parentFolder) return;

//         if (item.type === 'file') {
//           parentFolder.file(itemName, '');
//         } else {
//           const newFolder = parentFolder.folder(itemName);
//           if (newFolder) folderCache[item.path] = newFolder;
//         }
//       });

//       const blob = await zip.generateAsync({ type: 'blob' });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `${rootName}.zip`;
//       link.click();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
//     setFolderStructure(e.target.value);
//     setTouched(true);
//   };

//   const borderColor = !touched ? 'border-gray-200' : parseResult.isValid ? 'border-green-400' : 'border-red-400';
//   const focusRing = !touched ? 'focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-opacity-50' : parseResult.isValid ? 'focus-within:ring-2 focus-within:ring-green-400 focus-within:ring-opacity-50' : 'focus-within:ring-2 focus-within:ring-red-400 focus-within:ring-opacity-50';

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
//       {/* Header */}
//       <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
//         <div className="max-w-6xl mx-auto px-6 py-5">
//           <div className="flex items-center gap-3">
//             <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
//               <FileText size={24} className="text-white" />
//             </div>
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">FolderZip</h1>
//               <p className="text-sm text-gray-500 font-medium">Convert ASCII tree to downloadable ZIP</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Editor */}
//           <div className="lg:col-span-2 space-y-5">
//             <div>
//               <label className="text-sm font-semibold text-gray-900 block mb-3">
//                 Paste your folder structure
//               </label>
//               <div className={`relative rounded-xl border-2 ${borderColor} ${focusRing} transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md`}>
//                 <textarea
//                   value={folderStructure}
//                   onChange={handleTextAreaChange}
//                   className="w-full h-96 p-4 bg-white text-gray-900 font-mono text-sm focus:outline-none resize-none placeholder-gray-400"
//                   placeholder="project/&#10;├── folder/&#10;│   └── file.js"
//                   spellCheck="false"
//                 />
//                 {touched && (
//                   <div className="absolute top-4 right-4 animate-bounce">
//                     {parseResult.isValid ? (
//                       <div className="p-2 bg-green-100 rounded-full">
//                         <CheckCircle size={20} className="text-green-600" />
//                       </div>
//                     ) : (
//                       <div className="p-2 bg-red-100 rounded-full">
//                         <AlertCircle size={20} className="text-red-600" />
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//               <p className="text-xs text-gray-500 mt-2 font-medium">
//                 {touched && parseResult.isValid && `✓ ${parseResult.items.length} items ready to download`}
//                 {touched && !parseResult.isValid && `✗ ${parseResult.errors.length} issue${parseResult.errors.length !== 1 ? 's' : ''}`}
//               </p>
//             </div>

//             <button
//               onClick={downloadZip}
//               disabled={!parseResult.isValid || loading}
//               className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg ${
//                 parseResult.isValid && !loading
//                   ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 cursor-pointer transform hover:scale-105'
//                   : 'bg-gray-100 text-gray-400 cursor-not-allowed'
//               }`}
//             >
//               <Download size={20} />
//               {loading ? 'Creating your ZIP...' : 'Download ZIP'}
//             </button>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-5">
//             {/* Errors */}
//             {touched && parseResult.errors.length > 0 && (
//               <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
//                 <div className="flex items-center gap-2 mb-3">
//                   <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
//                   <h3 className="font-semibold text-red-900 text-sm">
//                     {parseResult.errors.length} Issue{parseResult.errors.length !== 1 ? 's' : ''}
//                   </h3>
//                 </div>
//                 <ul className="space-y-2">
//                   {parseResult.errors.map((err, i) => (
//                     <li key={i} className="text-xs text-red-800 leading-relaxed bg-red-100/50 p-2 rounded">
//                       {err}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Preview */}
//             {touched && parseResult.isValid && (
//               <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl shadow-sm">
//                 <div className="flex items-center gap-2 mb-3">
//                   <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
//                   <h3 className="font-semibold text-green-900 text-sm">
//                     Structure Valid
//                   </h3>
//                 </div>
//                 <div className="space-y-1 max-h-56 overflow-y-auto text-xs font-mono text-gray-700">
//                   {parseResult.items.map((item, i) => (
//                     <div key={i} className="truncate hover:text-gray-900 transition-colors py-1" title={item.path}>
//                       <span className="text-gray-400">{'  '.repeat(item.depth > 0 ? item.depth : 0)}</span>
//                       {item.type === 'file' ? <FileText size={14} className="inline mr-1.5 text-blue-500" /> : <Folder size={14} className="inline mr-1.5 text-amber-500" />}
//                       <span className="text-gray-800">{item.name}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Instructions */}
//             <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm">
//               <h3 className="font-semibold text-blue-900 text-sm mb-3">Format Rules</h3>
//               <ul className="text-xs text-blue-900 space-y-2">
//                 <li className="flex gap-2"><span className="font-bold">├──</span> <span>for items</span></li>
//                 <li className="flex gap-2"><span className="font-bold">└──</span> <span>for last item</span></li>
//                 <li className="flex gap-2"><span className="font-bold">│</span> <span>for nesting</span></li>
//                 <li className="flex gap-2"><span className="font-bold">.ext</span> <span>marks files</span></li>
//               </ul>
//             </div>

//             {/* Trust Badge */}
//             <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-sm">
//               <div className="flex items-start gap-2">
//                 <Zap size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <h3 className="font-semibold text-amber-900 text-sm mb-1">No Server Uploads</h3>
//                   <p className="text-xs text-amber-800 leading-relaxed">Everything happens locally in your browser. Your files are never sent anywhere.</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FolderToZip;










import { useState, FC, ChangeEvent, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, Zap, FileText, Folder } from 'lucide-react';
import JSZip from 'jszip';

interface TreeItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  depth: number;
}

interface ParseResult {
  items: TreeItem[];
  errors: string[];
  isValid: boolean;
}

const FolderToZip: FC = () => {
  const [folderStructure, setFolderStructure] = useState<string>(`project/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
`);

  const [loading, setLoading] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult>({ items: [], errors: [], isValid: false });
  const [touched, setTouched] = useState<boolean>(false);

  const sanitizeFileName = (name: string): string => {
    const invalidChars = /[<>:"|?*\x00-\x1F]/g;
    const invalidNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com9', 'lpt1', 'lpt9'];
    
    let sanitized = name.replace(invalidChars, '_').trim();
    if (sanitized && invalidNames.includes(sanitized.toLowerCase())) {
      sanitized = '_' + sanitized;
    }
    return sanitized || 'unnamed';
  };

  const getDepthFromLine = (line: string): number => {
    let depth = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '│' || line[i] === ' ') {
        if (i % 4 === 3) depth++;
      } else {
        break;
      }
    }
    return depth;
  };

  const parseStructure = (): ParseResult => {
    const lines = folderStructure.split('\n');
    const newErrors: string[] = [];
    const items: TreeItem[] = [];
    const pathStack: Array<{ name: string; depth: number; path: string }> = [];

    let rootName = '';
    let hasRoot = false;

    lines.forEach((line, idx) => {
      if (!line.trim()) return;

      const content = line.replace(/[│├──└\s]/g, '').trim();
      if (!content) return;

      if (!hasRoot) {
        rootName = content.replace(/\/$/, '');
        items.push({
          name: rootName,
          type: 'folder',
          path: rootName,
          depth: 0
        });
        pathStack.push({ name: rootName, depth: 0, path: rootName });
        hasRoot = true;
        return;
      }

      const depth = getDepthFromLine(line);
      const hasTreeChar = line.includes('├') || line.includes('└');

      if (!hasTreeChar) {
        newErrors.push(`Line ${idx + 1}: Missing tree characters (├── or └──)`);
        return;
      }

      const isFile = content.includes('.');
      const type: 'file' | 'folder' = isFile ? 'file' : 'folder';

      while (pathStack.length > 1 && pathStack[pathStack.length - 1].depth >= depth) {
        pathStack.pop();
      }

      const parentPath = pathStack[pathStack.length - 1]?.path || rootName;
      const sanitized = sanitizeFileName(content);
      const fullPath = `${parentPath}/${sanitized}`;

      items.push({
        name: sanitized,
        type,
        path: fullPath,
        depth
      });

      if (!isFile) {
        pathStack.push({ name: sanitized, depth, path: fullPath });
      }
    });

    const isValid = newErrors.length === 0 && items.length > 1;
    return { items, errors: newErrors, isValid };
  };

  useEffect(() => {
    const result = parseStructure();
    setParseResult(result);
  }, [folderStructure]);

  const downloadZip = async (): Promise<void> => {
    if (!parseResult.isValid) return;

    try {
      setLoading(true);
      const zip = new JSZip();
      const rootName = parseResult.items[0].name;
      const root = zip.folder(rootName);

      if (!root) throw new Error('Failed to create root folder');

      const folderCache: Record<string, any> = {};
      folderCache[rootName] = root;

      parseResult.items.slice(1).forEach((item) => {
        const parts = item.path.split('/');
        const itemName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');

        if (!folderCache[parentPath]) {
          const pathParts = parentPath.split('/');
          let currentFolder = zip;
          
          for (let i = 0; i < pathParts.length; i++) {
            const folderName = pathParts[i];
            const fullPath = pathParts.slice(0, i + 1).join('/');
            
            if (!folderCache[fullPath]) {
              const newFolder = currentFolder.folder(folderName);
              if (newFolder) {
                folderCache[fullPath] = newFolder;
                currentFolder = newFolder;
              }
            } else {
              currentFolder = folderCache[fullPath];
            }
          }
        }

        const parentFolder = folderCache[parentPath];
        if (!parentFolder) return;

        if (item.type === 'file') {
          parentFolder.file(itemName, '');
        } else {
          const newFolder = parentFolder.folder(itemName);
          if (newFolder) folderCache[item.path] = newFolder;
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${rootName}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setFolderStructure(e.target.value);
    setTouched(true);
  };

  const borderColor = !touched ? 'border-gray-200' : parseResult.isValid ? 'border-green-300' : 'border-red-300';
  const focusRing = !touched ? 'focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-opacity-30' : parseResult.isValid ? 'focus-within:ring-2 focus-within:ring-green-400 focus-within:ring-opacity-30' : 'focus-within:ring-2 focus-within:ring-red-400 focus-within:ring-opacity-30';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="FolderZip" className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FolderZip</h1>
              <p className="text-sm text-gray-500 font-medium">Convert ASCII tree to downloadable ZIP</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-3">
                Paste your folder structure
              </label>
              <div className={`relative rounded-xl border-2 ${borderColor} ${focusRing} transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md`}>
                <textarea
                  value={folderStructure}
                  onChange={handleTextAreaChange}
                  className="w-full h-96 p-4 bg-white text-gray-900 font-mono text-sm focus:outline-none resize-none placeholder-gray-400"
                  placeholder="project/&#10;├── folder/&#10;│   └── file.js"
                  spellCheck="false"
                />

              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                {touched && parseResult.isValid && `✓ ${parseResult.items.length} items ready to download`}
                {touched && !parseResult.isValid && `✗ ${parseResult.errors.length} issue${parseResult.errors.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            <button
              onClick={downloadZip}
              disabled={!parseResult.isValid || loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${
                parseResult.isValid && !loading
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download size={20} />
              {loading ? 'Creating your ZIP...' : 'Download ZIP'}
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Errors */}
            {touched && parseResult.errors.length > 0 && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <h3 className="font-semibold text-red-900 text-sm">
                    {parseResult.errors.length} Issue{parseResult.errors.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {parseResult.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-800 leading-relaxed bg-red-100/50 p-2 rounded">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview */}
            {touched && parseResult.isValid && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <h3 className="font-semibold text-green-900 text-sm">
                    Structure Valid
                  </h3>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto text-xs font-mono text-gray-700">
                  {parseResult.items.map((item, i) => (
                    <div key={i} className="truncate hover:text-gray-900 transition-colors py-1" title={item.path}>
                      <span className="text-gray-400">{'  '.repeat(item.depth > 0 ? item.depth : 0)}</span>
                      {item.type === 'file' ? <FileText size={14} className="inline mr-1.5 text-blue-500" /> : <Folder size={14} className="inline mr-1.5 text-amber-500" />}
                      <span className="text-gray-800">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-blue-900 text-sm mb-3">Format Rules</h3>
              <ul className="text-xs text-blue-900 space-y-2">
                <li className="flex gap-2"><span className="font-bold">├──</span> <span>for items</span></li>
                <li className="flex gap-2"><span className="font-bold">└──</span> <span>for last item</span></li>
                <li className="flex gap-2"><span className="font-bold">│</span> <span>for nesting</span></li>
                <li className="flex gap-2"><span className="font-bold">.ext</span> <span>marks files</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderToZip;