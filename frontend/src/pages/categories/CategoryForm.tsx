import React, { useState, useMemo } from 'react';
import './categories.css';

import { categoriesApi } from '../../api/categories';
import { Icon } from '../../components/Icon';
import { Category, useCategories } from '../../contexts/CategoriesContext';

type Props = {
  label: string;
  modify: boolean; // редактирование старой категории?
  submit: string;
  placeholder?: {
    category: Category;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
};

export const CategoryForm: React.FC<Props> = ({ label, submit, modify, placeholder }: Props) => {
  const { setCategories, icons } = useCategories();
  const [name, setName] = useState(placeholder ? placeholder.category.name : '');
  const [description, setDescription] = useState(
    placeholder ? placeholder.category.description : '',
  );

  const [icon, setIcon] = useState<string>(placeholder ? placeholder.category.icon : '');
  // const [type, setType] = useState<boolean>(placeholder ? !!placeholder.category.type : true);
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

      setName('');
      setDescription('');
      setIcon('');
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
        onChange={(e) => setName(e.target.value)}
        maxLength={15}
        required
      />

      <p className="cat-title">Описание</p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
      />

      <p className="cat-title">Выберите иконку</p>
      <div className="cat-icon-grid">
        {icons.map((iconSrc, i) => (
          <div key={iconSrc + i} onClick={() => setIcon(iconSrc)}>
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
          <button className="cat-button red" type="reset">
            Удалить
          </button>
        )}
      </div>
    </form>
  );
};
