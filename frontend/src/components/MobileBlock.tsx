import { useEffect, useRef, useState } from "react";

type Props = {
  title: string,
  children: React.ReactNode,
  defaultOpen?: boolean,
  onChange?: (isOpen: boolean) => void;
}

export const MobileBlock: React.FC<Props> = ({title, children, defaultOpen = false, onChange}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onChange?.(newState);
  };

  return (
    <div className="mobile-block">
      <div
        className="mobile-block-header"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <h2 className="mobile-block-title">{title}</h2>
      </div>
      
      {isOpen && <div className="mobile-block-content">{children}</div>}
    </div>
  );
}