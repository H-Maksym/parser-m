'use client';

import { Loader } from '@/_components/Loader';
import { FC, useState } from 'react';

// 1. Інтерфейс пропсів
interface IParsePage {
  className?: string;
}

export const ParsePage: FC<IParsePage> = ({ className }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleParse = async () => {
    if (!inputUrl) return;

    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch('/api/parse-megogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await res.json();

      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to fetch' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;

    const textToCopy = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadCSV = () => {
    const link = document.createElement('a');
    link.href = '/episodes.csv'; // шлях до файлу у public
    link.download = 'episodes.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={className}>
      <h1 className="text-2xl font-bold mb-4">MEGOGO Parser</h1>
      <input
        type="text"
        className="border p-2 w-full max-w-xl mb-4"
        placeholder="Встав URL серії з megogo.net"
        value={inputUrl}
        onChange={e => setInputUrl(e.target.value)}
      />
      <button
        onClick={handleParse}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Завантаження...' : 'Парсити'}
      </button>
      {loading && <Loader />}
      {result && (
        <>
          <div className="flex items-center mt-6 space-x-4">
            <button
              onClick={handleCopy}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              {copied ? 'Скопійовано!' : 'Скопіювати'}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Завантажити CSV
            </button>
          </div>
          <pre className="mt-2 bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
};
