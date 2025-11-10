import React, { useMemo, useState } from 'react';
import './categories.css';

import { Category, useCategories } from '../../contexts/CategoriesContext';

import { CategoryCard } from './CategoryCard';
import { CategoryForm } from './CategoryForm';
import { CategoryWindow } from './CategoryWindow';

export const CategoriesPage: React.FC = () => {
  const { categories } = useCategories();

  const [cardWindow, setCardWindow] = useState<Category>();
  const [isOpen, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  /*
  const [filter, setFilter] = useState('all');
  const filters = useMemo(
    () => [
      ['all', 'Все'],
      ['income', 'Доходы'],
      ['expense', 'Расходы'],
    ],
    [],
  );
  */

  const isMobile = useMemo(() => {
    const style = window.getComputedStyle(document.body);
    const base = Number(style.fontSize.replace('px', ''));
    const width = Number(style.width.replace('px', ''));
    const rem = width / base;
    return rem <= 48;
  }, []);

  const openCard = (cat: Category) => {
    setCardWindow(cat);
    setOpen(true);
  };

  const filteredCategories = useMemo(
    () =>
      categories
        /*.filter((cat) => {
          if (filter === 'all') return true;
          else if (filter === 'income') return !!cat.type;
          else return !cat.type;
        })*/
        .filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [/*filter, */ categories, searchQuery],
  );

  const categoryCards = useMemo(
    () =>
      filteredCategories.map((cat) => (
        <CategoryCard key={cat.id} cat={cat} handleClick={() => openCard(cat)} />
      )),
    [filteredCategories],
  );

  return (
    <div aria-label="content-placeholder" className="cat-main">
      <div className="cat-list">
        <div className="cat-list-selectors">
          <input
            type="text"
            placeholder="Поиск"
            className="cat-text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/*
          <div className="cat-filters cat-text">
            {filters.map((f) => (
              <button
                key={f[0]}
                className={filter === f[0] ? 'cat-filter-active' : ''}
                onClick={() => setFilter(f[0])}
              >
                {f[1]}
              </button>
            ))}
          </div>
          */}
        </div>
        <div className="cat-list-grid">{categoryCards}</div>
      </div>
      {!isMobile && (
        <CategoryForm label={'Добавить категорию'} modify={false} submit={'Добавить'} />
      )}

      <button
        className="cat-mobile-add-button"
        onClick={() => setShowAddForm(true)}
        aria-label="Добавить категорию"
      >
        + Добавить категорию
      </button>

      {showAddForm && (
        <div className="cat-window">
          <div className="cat-window-bg" onClick={() => setShowAddForm(false)} />
          <CategoryForm label={'Добавить категорию'} modify={false} submit={'Добавить'} />
        </div>
      )}

      {isOpen && cardWindow && <CategoryWindow cat={cardWindow} setOpen={setOpen} />}
    </div>
  );
};
