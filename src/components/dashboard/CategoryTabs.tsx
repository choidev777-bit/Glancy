import React from 'react';
import { CATEGORIES, CATEGORY_LABELS } from '../../lib/market-selection';

interface CategoryTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, setActiveCategory }) => {
  return (
    <div className="bg-surface-1 border-b border-border overflow-x-auto no-scrollbar">
      <div className="flex px-4">
        {CATEGORIES.map((category) => (
          <div
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`
              tab-category whitespace-nowrap
              ${activeCategory === category ? 'tab-category-active' : 'tab-category-inactive'}
            `}
          >
            {CATEGORY_LABELS[category] ?? category}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
