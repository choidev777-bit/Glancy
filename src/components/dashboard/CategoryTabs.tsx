import React from 'react';
import { CATEGORY_LABELS } from '../../lib/market-selection';

export type TopLevelTab = 'dashboard' | 'asset-search' | 'csv-upload';

export const TOP_LEVEL_TABS: Array<{ id: TopLevelTab; label: string }> = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'asset-search', label: '자산검색' },
  { id: 'csv-upload', label: 'CSV 업로드' },
];

interface CategoryTabsProps {
  activeTopTab: TopLevelTab;
  setActiveTopTab: (tab: TopLevelTab) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  marketCategories: string[];
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTopTab,
  setActiveTopTab,
  activeCategory,
  setActiveCategory,
  marketCategories,
}) => {
  return (
    <div className="border-b border-border bg-surface-1">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex px-4">
          {TOP_LEVEL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTopTab(tab.id)}
              className={`
              tab-category whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1
              ${activeTopTab === tab.id ? 'tab-category-active' : 'tab-category-inactive'}
            `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTopTab === 'asset-search' && (
        <div className="border-t border-border bg-background px-4 py-3">
          <label className="flex w-full max-w-xs flex-col gap-2 text-xs font-bold text-text-tertiary">
            시장 선택
            <select
              value={activeCategory}
              onChange={(event) => setActiveCategory(event.target.value)}
              className="rounded-card border border-border bg-surface-2 px-3 py-2 text-sm font-bold text-text-primary transition-colors focus:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {marketCategories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category] ?? category}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
};

export default CategoryTabs;
