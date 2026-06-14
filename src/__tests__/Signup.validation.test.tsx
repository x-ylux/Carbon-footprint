import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Signup } from '../pages/Signup';

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    signUp: vi.fn(async () => ({ error: null, needsVerification: false })),
  }),
}));

describe('Signup page validation', () => {
  it('displays validation errors when required fields are missing', async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });
});
