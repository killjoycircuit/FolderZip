import { useState } from 'react';
import { Download, Copy, Check, AlertCircle } from 'lucide-react';

export default function FolderToZip() {
  const [folderStructure, setFolderStructure] = useState(`project/
├─ src/
│  ├─ index.js
│  ├─ style.css
│  └─ App.jsx
├─ public/
│  └─ index.html
├─ assets/
│  └─ logo.png
└─ README.md`);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);

  const invalidChars = /[<>:"|?*\x00-\x1F]/g;
  const invalidNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com9', 'lpt1', 'lpt9'];

  const sanitizeFileName = (name) => {
    let sanitized = name.replace(invalidChars, '_').trim();
    if (invalidNames.includes(sanitized.toLowerCase())) {
      sanitized = '_' + sanitized;
    }
    return sanitized || 'unnamed';
  };

  const parseStructure = () => {
    const lines = folderStructure.split('\n');
    const newErrors = [];
    const items = [];
    const pathStack = [{ name: 'root', depth: -1, path: '' }];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;

      const content = line.replace(/[│├─└]/g, '').trim();
      if (!content) return;

      const depth = (line.match(/│/g) || []).length;
      const isItem = line.includes('├─') || line.includes('└─');

      if (!isItem && idx > 0) {
        newErrors.push(`Line ${idx + 1}: Invalid format`);
        return;
      }

      if (content.length === 0) {
        newErrors.push(`Line ${idx + 1}: Empty name`);
        return;
      }

      const sanitized = sanitizeFileName(content);
      const isFile = content.includes('.');
      const type = isFile ? 'file' : 'folder';

      while (pathStack.length > 1 && pathStack[pathStack.length - 1].depth >= depth) {
        pathStack.pop();
      }

      const parentPath = pathStack[pathStack.length - 1].path;
      const fullPath = parentPath ? `${parentPath}/${sanitized}` : sanitized;

      items.push({
        name: sanitized,
        type,
        path: fullPath,
        depth,
        original: content
      });

      if (!isFile) {
        pathStack.push({ name: sanitized, depth, path: fullPath });
      }
    });

    setPreview(items);
    setErrors(newErrors);
    return { items, errors: newErrors };
  };

  const downloadZip = async () => {
    const { items, errors: parseErrors } = parseStructure();

    if (parseErrors.length > 0) {
      alert(`Fix ${parseErrors.length} error(s) before downloading`);
      return;
    }

    if (items.length === 0) {
      alert('No valid files or folders to create');
      return;
    }

    try {
      setLoading(true);
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const rootName = items[0]?.path?.split('/')[0] || 'project';
      const root = zip.folder(rootName);
      const folderCache = { [rootName]: root };

      items.forEach(item => {
        const parts = item.path.split('/');
        const fileName = parts[parts.length - 1];
        const folderPath = parts.slice(0, -1).join('/');

        let currentFolder = folderCache[folderPath] || root;

        if (item.type === 'folder') {
          if (!folderCache[item.path]) {
            currentFolder = currentFolder.folder(fileName);
            folderCache[item.path] = currentFolder;
          }
        } else {
          currentFolder.file(fileName, '');
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rootName}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + err.message);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(folderStructure);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = () => {
    parseStructure();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">FolderZip</h1>
          <p className="text-sm text-gray-500 mt-1">Convert ASCII structures to ZIP files</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Paste your folder structure
                </label>
                <textarea
                  value={folderStructure}
                  onChange={(e) => setFolderStructure(e.target.value)}
                  className="w-full h-96 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="project/&#10;├─ src/&#10;│  ├─ index.js"
                  spellCheck="false"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>

                <button
                  onClick={handleValidate}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Check
                </button>

                <button
                  onClick={downloadZip}
                  disabled={loading || errors.length > 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  {loading ? 'Generating...' : 'Download'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={18} className="text-red-600" />
                  <h3 className="font-medium text-red-900 text-sm">{errors.length} error{errors.length !== 1 ? 's' : ''}</h3>
                </div>
                <ul className="space-y-1">
                  {errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && errors.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 text-sm mb-3">{preview.length} item{preview.length !== 1 ? 's' : ''} ready</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto text-xs font-mono text-gray-700">
                  {preview.map((item, i) => (
                    <div key={i} className="truncate" title={item.name}>
                      <span className="text-gray-400">{'  '.repeat(item.depth)}</span>
                      {item.type === 'file' ? '📄' : '📁'} {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 text-sm mb-2">Format</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>├─ for items</li>
                <li>└─ for last item</li>
                <li>│ for nesting</li>
                <li>.ext for files</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 text-sm mb-2">Supports</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                JavaScript, Python, Java, C++, React, Vue, Angular, HTML, CSS, JSON, YAML, Docker, and 100+ more file types.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}