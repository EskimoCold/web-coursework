import React, { useMemo, useState } from 'react';
import './categories.css';

import { CategoryCard } from './CategoryCard';
import { CategoryWindow } from './CategoryWindow';
import { Category, useCategories } from '../../contexts/CategoriesContext';
import { CategoryForm } from './CategoryForm';

export const CategoriesPage: React.FC = () => {
	const {categories} = useCategories();
	
	const [cardWindow, setCardWindow] = useState<Category>();
	const [isOpen, setOpen] = useState(false);
	
	const [searchQuery, setSearchQuery] = useState('');
	const [filter, setFilter] = useState('all');
	const filters = useMemo(() => [
		['all', 'Все'],
		['income', 'Доходы'],
		['expense', 'Расходы']
	], []);

	const openCard = (cat: Category) => {
		setCardWindow(cat);
		setOpen(true);
	}

	const filteredCategories = useMemo(() => 
		categories
			.filter((cat) => {
				if (filter === 'all') return true;
				else if (filter === 'income') return !!cat.type;
				else return !cat.type;
			})
			.filter((cat) => 
				cat.name
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
			),
		[filter, categories, searchQuery]
	);

	const categoryCards = useMemo(() => 
		filteredCategories.map((cat) => 
			(<CategoryCard 
				key={cat.id} 
				cat={cat}
				handleClick={() => openCard(cat)}/>
			)
		), 
		[filteredCategories, openCard]
	);

  return (<div className='cat-main'>
    <div className='cat-list'>
      <div className='cat-list-selectors'>
        <input
					type='text'
					placeholder='Поиск'
					className='cat-text'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<div className='cat-filters cat-text'>
					{filters.map((f) => (
						<button 
							key={f[0]}
							className={filter === f[0] ? 'cat-filter-active' : ''}
							onClick={() => setFilter(f[0])}>
								{f[1]}
						</button>
					))}
				</div>
      </div>
			<div className='cat-list-grid'>
				{categoryCards}
			</div>
    </div>
		<CategoryForm 
			label={'Добавить категорию'}
			modify={false} 
			submit={'Добавить'}
		/>
		{ // Всплывающее окно для редактирования категории 
			isOpen && 
			cardWindow && 
			<CategoryWindow cat={cardWindow} setOpen={setOpen}/>
		}
  </div>);
};
