import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AuthContext } from '../context/auth-context';
import React from 'react';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(async ({ email, password }: { email: string; password: string }) => {
        if (email === 'test@example.com' && password === 'password123') {
          return {
            data: {
              user: { id: '1', email: 'test@example.com' },
              session: { user: { id: '1', email: 'test@example.com' } },
            },
            error: null,
          };
        }
        return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
      }),
      signUp: vi.fn(async () => ({
        data: { user: { id: '1', email: 'new@example.com' }, session: null },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: '1', email: 'test@example.com', name: 'Test User' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

const TestConsumer: React.FC = () => {
  const { user, loading, signIn, signOut } = React.useContext(AuthContext)!;

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user-status">{user ? `Logged in as ${user.email}` : 'Not logged in'}</div>
      <button
        type="button"
        onClick={() => signIn('test@example.com', 'password123')}
        aria-label="Sign in"
      >
        Sign In
      </button>
      <button type="button" onClick={signOut} aria-label="Sign out">
        Sign Out
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial null user when not authenticated', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status').textContent).toBe('Not logged in');
    });
  });

  it('allows sign in with valid credentials', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByTestId('user-status').textContent).toContain('Logged in');
    });
  });
});
