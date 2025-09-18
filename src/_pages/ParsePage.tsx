'use client';

import { Loader } from '@/_components/Loader';
import { FC, useState } from 'react';

interface IParsePage {
  className?: string;
}

export const ParsePage: FC<IParsePage> = ({ className }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [result, setResult] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 🔍 Парсинг і вивід JSON у інтерфейс
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

      if (!res.ok) {
        const errorData = await res.json();
        setResult({ error: errorData.error || 'Сервер повернув помилку' });
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to fetch', err });
    } finally {
      setLoading(false);
    }
  };

  // 💾 Скачування CSV
  const handleDownloadCSV = async () => {
    if (!inputUrl) return;

    setLoading(true);

    try {
      const res = await fetch('/api/parse-megogo?format=csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setResult({ error: errorData.error || 'Помилка при завантаженні CSV' });
        return;
      }

      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'episodes.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // setResult({ success: 'CSV файл успішно завантажено' });
    } catch (err) {
      setResult({ error: 'Помилка при скачуванні CSV', err });
    } finally {
      setLoading(false);
    }
  };

  // 📋 Копіювання JSON у буфер
  const handleCopy = () => {
    if (!result) return;

    const textToCopy = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
            >
              Завантажити CSV
            </button>
          </div>

          <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
};
