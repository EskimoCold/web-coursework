import { useState } from 'react';

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onChange?: (isOpen: boolean) => void;
  className?: string;
};

export const MobileBlock: React.FC<Props> = ({
  title,
  children,
  defaultOpen = false,
  onChange,
  className = '',
}: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onChange?.(newState);
  };

  return (
    <div className={className}>
      <div onClick={toggle} role="button" tabIndex={0} aria-expanded={isOpen}>
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
          }}
        >
          {title}
        </h2>
      </div>

      {isOpen && <>{children}</>}
    </div>
  );
};
