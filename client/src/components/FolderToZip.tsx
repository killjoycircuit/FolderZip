import { useState, FC, ChangeEvent } from 'react';
import { Download, Copy, Check, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';

interface TreeItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  depth: number;
  original: string;
}

interface ParseResult {
  items: TreeItem[];
  errors: string[];
}

interface PathStackItem {
  name: string;
  depth: number;
  path: string;
}

const FolderToZip: FC = () => {
  const [folderStructure, setFolderStructure] = useState<string>(`project/
├─ src/
│  ├─ index.js
│  ├─ style.css
│  └─ App.jsx
├─ public/
│  └─ index.html
├─ assets/
│  └─ logo.png
└─ README.md`);

  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<TreeItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const invalidChars: RegExp = /[<>:"|?*\x00-\x1F]/g;
  const invalidNames: string[] = ['con', 'prn', 'aux', 'nul', 'com1', 'com9', 'lpt1', 'lpt9'];

  const sanitizeFileName = (name: string): string => {
    let sanitized: string = name.replace(invalidChars, '_').trim();
    if (invalidNames.includes(sanitized.toLowerCase())) {
      sanitized = '_' + sanitized;
    }
    return sanitized || 'unnamed';
  };

  const parseStructure = (): ParseResult => {
    const lines: string[] = folderStructure.split('\n');
    const newErrors: string[] = [];
    const items: TreeItem[] = [];
    const pathStack: PathStackItem[] = [{ name: 'root', depth: -1, path: '' }];

    lines.forEach((line: string, idx: number) => {
      if (!line.trim()) return;

      const content: string = line.replace(/[│├─└]/g, '').trim();
      if (!content) return;

      const depth: number = (line.match(/│/g) || []).length;
      const isItem: boolean = line.includes('├─') || line.includes('└─');

      if (!isItem && idx > 0) {
        newErrors.push(`Line ${idx + 1}: Invalid format`);
        return;
      }

      if (content.length === 0) {
        newErrors.push(`Line ${idx + 1}: Empty name`);
        return;
      }

      const sanitized: string = sanitizeFileName(content);
      const isFile: boolean = content.includes('.');
      const type: 'file' | 'folder' = isFile ? 'file' : 'folder';

      while (pathStack.length > 1 && pathStack[pathStack.length - 1].depth >= depth) {
        pathStack.pop();
      }

      const parentPath: string = pathStack[pathStack.length - 1].path;
      const fullPath: string = parentPath ? `${parentPath}/${sanitized}` : sanitized;

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

  const downloadZip = async (): Promise<void> => {
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
      const zip = new JSZip();

      const rootName: string = items[0]?.path?.split('/')[0] || 'project';
      const root = zip.folder(rootName);
      
      if (!root) {
        throw new Error('Failed to create root folder');
      }

      const folderCache: Record<string, JSZip> = { [rootName]: root };

      items.forEach((item: TreeItem) => {
        const parts: string[] = item.path.split('/');
        const fileName: string = parts[parts.length - 1];
        const folderPath: string = parts.slice(0, -1).join('/');

        let currentFolder: JSZip = folderCache[folderPath] || root;

        if (item.type === 'folder') {
          if (!folderCache[item.path]) {
            const newFolder = currentFolder.folder(fileName);
            if (newFolder) {
              folderCache[item.path] = newFolder;
            }
          }
        } else {
          currentFolder.file(fileName, '');
        }
      });

      const blob: Blob = await zip.generateAsync({ type: 'blob' });
      const url: string = URL.createObjectURL(blob);
      const a: HTMLAnchorElement = document.createElement('a');
      a.href = url;
      a.download = `${rootName}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Error: ' + errorMessage);
      setLoading(false);
    }
  };

  const handleCopy = (): void => {
    navigator.clipboard.writeText(folderStructure);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = (): void => {
    parseStructure();
  };

  const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setFolderStructure(e.target.value);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="FolderZip" className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FolderZip</h1>
              <p className="text-xs text-gray-500">Convert ASCII structures to ZIP files</p>
            </div>
          </div>
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
                  onChange={handleTextAreaChange}
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
                  <h3 className="font-medium text-red-900 text-sm">
                    {errors.length} error{errors.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                <ul className="space-y-1">
                  {errors.map((err: string, i: number) => (
                    <li key={i} className="text-xs text-red-700">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && errors.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 text-sm mb-3">
                  {preview.length} item{preview.length !== 1 ? 's' : ''} ready
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto text-xs font-mono text-gray-700">
                  {preview.map((item: TreeItem, i: number) => (
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
                <li className="text-red-600 font-semibold">no comments after items</li>
              </ul>
            </div>

            {/* Supported types */}
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
};

export default FolderToZip;