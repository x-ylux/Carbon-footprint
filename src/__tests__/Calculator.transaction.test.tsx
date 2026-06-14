import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Calculator from '../pages/Calculator';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user', email: 'test@example.com' },
    session: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

type QueryMock = {
  eq: () => QueryMock;
  order: () => QueryMock;
  then: (cb: (result: { data: any[]; error: null }) => void) => void;
};

const mockQuery: QueryMock = {
  eq: vi.fn(() => mockQuery),
  order: vi.fn(() => mockQuery),
  then: vi.fn((cb) => cb({ data: [], error: null })),
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockQuery),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

describe('Calculator cash transaction form', () => {
  it('shows validation when amount is missing or invalid', async () => {
    render(
      <MemoryRouter>
        <Calculator />
      </MemoryRouter>
    );

    const addButton = screen.getByRole('button', { name: /add transaction/i });
    await userEvent.click(addButton);

    expect(await screen.findByText(/amount must be positive/i)).toBeInTheDocument();
  });
});
