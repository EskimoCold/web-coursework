import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

describe('PrivacyPolicyModal', () => {
  it('should not render when isOpen is false', () => {
    render(<PrivacyPolicyModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Политика конфиденциальности')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<PrivacyPolicyModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Политика конфиденциальности')).toBeInTheDocument();
  });

  it('should display privacy policy content', () => {
    render(<PrivacyPolicyModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('1. Сбор информации')).toBeInTheDocument();
    expect(screen.getByText('2. Использование данных')).toBeInTheDocument();
    expect(screen.getByText('3. Защита данных')).toBeInTheDocument();
    expect(screen.getByText('4. Права пользователя')).toBeInTheDocument();
    expect(screen.getByText('5. Изменения в политике')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when background is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);

    const background = document.querySelector('.settings-modal-bg');
    expect(background).toBeInTheDocument();

    if (background) {
      await user.click(background);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onClose when "Закрыть" button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByText('Закрыть');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
