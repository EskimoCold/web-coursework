import React, { useState, useMemo } from 'react';
import './categories.css';

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
  const { setCategories } = useCategories();
  const [name, setName] = useState(placeholder ? placeholder.category.name : '');
  const [description, setDescription] = useState(
    placeholder ? placeholder.category.description : '',
  );
  const [icon, setIcon] = useState<string>(placeholder ? placeholder.category.icon : '');
  const [type, setType] = useState<boolean>(placeholder ? !!placeholder.category.type : true);
  const isSubmittable = useMemo(() => !!name.trim().length && !!icon.length, [name, icon]);

  // здесь нужен useIcons (пока что его нет, потому что нет иконок) из контекста CategoryContext
  const possibleIconsList = Array.from({ length: 20 }, () => 'sample.png');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const body = {
        id: '',
        name: name.trim(),
        description: description.trim(),
        icon: icon,
        type: type ? 1 : 0,
      };
      if (modify && placeholder) body.id = placeholder.category.id.toString();

      const response = await fetch('/api/cat/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Ошибка');

      setName('');
      setDescription('');
      setIcon('');

      const result = await response.json();

      const newCategory = result.category;
      if (!placeholder) setCategories((prev) => [...prev, newCategory]);
      else {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === placeholder.category.id ? newCategory : cat)),
        );
        placeholder.setOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!placeholder) return;

    try {
      const response = await fetch('/api/cat/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: placeholder.category.id,
        }),
      });
      if (!response.ok) throw new Error('Ошибка');

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
        {possibleIconsList.map((iconSrc, i) => (
          <div key={iconSrc + i} onClick={() => setIcon(iconSrc)}>
            <Icon
              source={iconSrc}
              size={35}
              className={`cat-grid-icon-item ${icon === iconSrc ? 'selected' : ''}`}
            />
          </div>
        ))}
      </div>

      <p className="cat-title">Тип</p>
      <button
        className={`cat-button ${type ? 'green' : 'red'}`}
        type="button"
        onClick={() => setType(!type)}
      >
        {type ? 'Доход' : 'Расход'}
      </button>

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
