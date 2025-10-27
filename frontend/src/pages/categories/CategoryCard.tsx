import './categories.css';
import { Icon } from '../../components/Icon';
import { Category } from '../../contexts/CategoriesContext';

type Props = {
  cat: Category;
  handleClick: () => void;
  icon?: string;
};

export const CategoryCard: React.FC<Props> = ({ cat, handleClick }: Props) => {
  return (
    <div className="cat-card" onClick={handleClick}>
      <div>
        <p className="cat-card-title">{cat.name}</p>
        <p className={`cat-card-type-title ${cat.type ? 'green' : 'red'}`}>
          {cat.type ? 'Доход' : 'Расход'}
        </p>
      </div>
      <Icon source={cat.icon} size={60} className={'cat-card-icon'} />
    </div>
  );
};
