// src/components/HomePage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage', () => {
    it('renders summary cards with correct data', () => {
        render(<HomePage />);

        expect(screen.getByText('Общий баланс')).toBeInTheDocument();
        expect(screen.getByText('Доходы')).toBeInTheDocument();
        expect(screen.getByText('Расходы')).toBeInTheDocument();
    });

    it('filters transactions by type', () => {
        render(<HomePage />);

        // Изначально показываются все транзакции
        expect(screen.getByText('Продукты')).toBeInTheDocument();
        expect(screen.getByText('Зарплата')).toBeInTheDocument();

        // Фильтруем по доходам
        fireEvent.click(screen.getByText('Доходы'));
        expect(screen.getByText('Зарплата')).toBeInTheDocument();
        expect(screen.queryByText('Продукты')).not.toBeInTheDocument();

        // Фильтруем по расходам
        fireEvent.click(screen.getByText('Расходы'));
        expect(screen.getByText('Продукты')).toBeInTheDocument();
        expect(screen.queryByText('Зарплата')).not.toBeInTheDocument();
    });

    it('paginates transactions', () => {
        render(<HomePage />);

        // Проверяем что есть пагинация
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        // Переходим на вторую страницу
        fireEvent.click(screen.getByText('2'));
        expect(screen.getByText('2').className).toContain('active');
    });
});