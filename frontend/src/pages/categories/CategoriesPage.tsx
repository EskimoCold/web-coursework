import React, { useMemo } from 'react';
import './categories.css';

import { Category, useCategories } from '../../contexts/CategoriesContext';
import { useCategoriesPageStore } from './categoriesPageStore';

import { CategoryCard } from './CategoryCard';
import { CategoryForm } from './CategoryForm';
import { CategoryWindow } from './CategoryWindow';

export const CategoriesPage: React.FC = () => {
  const { categories } = useCategories();
  const { cardWindow, isOpen, showAddForm, searchQuery, setCardWindow, setIsOpen, setShowAddForm, setSearchQuery } =
    useCategoriesPageStore();

  const isMobile = useMemo(() => {
    const style = window.getComputedStyle(document.body);
    const base = Number(style.fontSize.replace('px', ''));
    const width = Number(style.width.replace('px', ''));
    const rem = width / base;
    return rem <= 48;
  }, []);

  const openCard = (cat: Category) => {
    setCardWindow(cat);
    setIsOpen(true);
  };

  const filteredCategories = useMemo(
    () =>
      categories.filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [categories, searchQuery],
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

      {isOpen && cardWindow && <CategoryWindow cat={cardWindow} setOpen={setIsOpen} />}
    </div>
  );
};
