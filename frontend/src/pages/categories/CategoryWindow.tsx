import { Category } from '../../contexts/CategoriesContext';
import './categories.css';

import { CategoryForm } from './CategoryForm';

type Props = {
  cat: Category;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CategoryWindow: React.FC<Props> = ({ cat, setOpen }: Props) => {
  return (
    <div className="cat-window">
      <div className="cat-window-bg" onClick={() => setOpen(false)} />
      <CategoryForm
        label={'Изменить категорию'}
        modify={true}
        submit={'Изменить'}
        placeholder={{ category: cat, setOpen: setOpen }}
      />
    </div>
  );
};
