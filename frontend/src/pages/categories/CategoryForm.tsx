import React, { useEffect, useMemo } from 'react';
import './categories.css';

import { categoriesApi } from '../../api/categories';
import { Icon } from '../../components/Icon';
import { Category, useCategories } from '../../contexts/CategoriesContext';

import { createCategoryFormStore } from './categoryFormStore';

type Props = {
  label: string;
  modify: boolean; // редактирование старой категории?
  submit: string;
  placeholder?: {
    category: Category;
    setOpen: (open: boolean) => void;
  };
};

export const CategoryForm: React.FC<Props> = ({ label, submit, modify, placeholder }: Props) => {
  const { setCategories, icons } = useCategories();
  const formStore = useMemo(() => createCategoryFormStore(), []);
  const name = formStore((state) => state.name);
  const description = formStore((state) => state.description);
  const icon = formStore((state) => state.icon);
  const setField = formStore((state) => state.setField);
  const reset = formStore((state) => state.reset);
  const hydrate = formStore((state) => state.hydrate);

  useEffect(() => {
    hydrate(placeholder?.category);
  }, [hydrate, placeholder?.category]);
  const isSubmittable = useMemo(() => !!name.trim().length && !!icon.length, [name, icon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modify) {
        if (!placeholder) throw new Error('Category that you want update must have id');

        const category: Category = {
          id: placeholder.category.id,
          icon: icon,
          name: name.trim(),
          description: description.trim(),
        };

        const updatedCategory = await categoriesApi.updateCategory(category);
        setCategories((prev) =>
          prev.map((cat) => (cat.id === placeholder.category.id ? updatedCategory : cat)),
        );

        placeholder.setOpen(false);
      } else {
        const newCategory = await categoriesApi.addCategory(name, description, icon);
        setCategories((prev) => [...prev, newCategory]);
      }

      reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!placeholder) throw new Error('Category that you want delete must have id');

      categoriesApi.deleteCategory(placeholder.category.id);
      setCategories((prev) => prev.filter((cat) => cat.id !== placeholder.category.id));

      placeholder.setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} onReset={handleDelete} className="cat-form">
      <h1>{label}</h1>
      <p className="cat-title">Название категории</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setField('name', e.target.value)}
        maxLength={15}
        required
      />

      <p className="cat-title">Описание</p>
      <textarea
        value={description}
        onChange={(e) => setField('description', e.target.value)}
        maxLength={200}
      />

      <p className="cat-title">Выберите иконку</p>
      <div className="cat-icon-grid">
        {icons.map((iconSrc, i) => (
          <div key={iconSrc + i} onClick={() => setField('icon', iconSrc)}>
            <Icon
              source={iconSrc}
              size={35}
              className={`cat-grid-icon-item ${icon === iconSrc ? 'selected' : ''}`}
            />
          </div>
        ))}
      </div>

      {/*
      <p className="cat-title">Тип</p>
      <button
        className={`cat-button ${type ? 'green' : 'red'}`}
        type="button"
        onClick={() => setType(!type)}
      >
        {type ? 'Доход' : 'Расход'}
      </button>
      */}

      <div className="cat-form-buttons">
        <button className="cat-button submit" type="submit" disabled={!isSubmittable}>
          {submit}
        </button>
        {modify && (
          <button className="cat-button danger" type="reset">
            Удалить
          </button>
        )}
      </div>
    </form>
  );
};
