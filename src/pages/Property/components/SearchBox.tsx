/**
 * SearchBox Component
 *
 * PropertyListPage 的搜尋框元件
 */

import React from 'react';

interface SearchBoxProps {
  searchInput: string;
  urlQuery: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function SearchBox({
  searchInput,
  urlQuery,
  onSearchInputChange,
  onSearch,
  onClear,
  onKeyDown,
}: SearchBoxProps) {
  return (
    <div className="search-container">
      <div className="search-box">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 text-[#5b6b7b]"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="搜尋社區名稱、區域或建案關鍵字..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="button" className="search-btn" onClick={onSearch}>
          搜尋
        </button>
      </div>
      <div className="search-hint">
        {urlQuery ? (
          <>
            搜尋「{urlQuery}」的結果 ·{' '}
            <button
              type="button"
              className="text-brand-600 hover:underline"
              onClick={onClear}
            >
              清除搜尋
            </button>
          </>
        ) : (
          <>例如：「林口」、「捷運」、「學區」</>
        )}
      </div>
    </div>
  );
}
