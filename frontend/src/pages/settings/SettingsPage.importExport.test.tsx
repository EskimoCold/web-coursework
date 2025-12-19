import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usersApi } from '../../api/users';
import { AuthProvider } from '../../contexts/AuthContext';
import { CurrencyProvider } from '../../contexts/CurrencyContext';

import { SettingsPage } from './SettingsPage';

vi.mock('../../api/users');
vi.mock('../../api/auth', () => ({
  authApi: {
    changePassword: vi.fn(),
  },
}));

const mockUsersApi = vi.mocked(usersApi);

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <CurrencyProvider>{component}</CurrencyProvider>
    </AuthProvider>,
  );
};

describe('DataManagementSection - Export/Import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();

    if (!window.URL.createObjectURL) {
      (window.URL as any).createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (!window.URL.revokeObjectURL) {
      (window.URL as any).revokeObjectURL = vi.fn();
    }

    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it('should export data when JSON button is clicked', async () => {
    const user = userEvent.setup();
    const mockBlob = new Blob(['{"test": "data"}'], { type: 'application/json' });
    mockUsersApi.exportData.mockResolvedValue(mockBlob);

    const createElementSpy = vi.spyOn(document, 'createElement');

    renderWithProviders(<SettingsPage />);

    const dataTab = screen.getByText('Данные');
    await user.click(dataTab);

    const exportButton = await screen.findByText('JSON');
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockUsersApi.exportData).toHaveBeenCalledTimes(1);
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  it('should handle export error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Export failed';
    mockUsersApi.exportData.mockRejectedValue(new Error(errorMessage));

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<SettingsPage />);

    const dataTab = screen.getByText('Данные');
    await user.click(dataTab);

    const exportButton = await screen.findByText('JSON');
    await user.click(exportButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Export error:', expect.any(Error));

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should import data when file is selected', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['{"version": "1.0"}'], 'test.json', { type: 'application/json' });
    const mockResult = {
      message: 'Import completed',
      imported_categories: 2,
      imported_transactions: 5,
      errors: null,
    };

    mockUsersApi.importData.mockResolvedValue(mockResult);

    renderWithProviders(<SettingsPage />);

    const dataTab = screen.getByText('Данные');
    await user.click(dataTab);

    await waitFor(() => {
      expect(screen.getByText('Управление данными')).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(mockUsersApi.importData).toHaveBeenCalledWith(mockFile);
    });

    await waitFor(() => {
      expect(screen.getByText(/Импорт завершен/)).toBeInTheDocument();
    });
  });

  it('should show error for non-JSON files', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    renderWithProviders(<SettingsPage />);

    const dataTab = screen.getByText('Данные');
    await user.click(dataTab);

    await waitFor(() => {
      expect(screen.getByText('Управление данными')).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(mockUsersApi.importData).not.toHaveBeenCalled();
    });
  });

  it('should handle import error', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['{"version": "1.0"}'], 'test.json', { type: 'application/json' });
    const errorMessage = 'Import failed';

    mockUsersApi.importData.mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<SettingsPage />);

    const dataTab = screen.getByText('Данные');
    await user.click(dataTab);

    await waitFor(() => {
      expect(screen.getByText('Управление данными')).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText(/Ошибка при импорте/)).toBeInTheDocument();
    });
  });
});
