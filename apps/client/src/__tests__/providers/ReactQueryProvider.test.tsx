import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { useQueryClient } from '@tanstack/react-query';
import { render, renderHook, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('ReactQueryProvider', () => {
  it('renders its children', () => {
    render(
      <ReactQueryProvider>
        <p>child</p>
      </ReactQueryProvider>,
    );

    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('gives its children the shared browser query client', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <ReactQueryProvider>{children}</ReactQueryProvider>;

    const first = renderHook(() => useQueryClient(), { wrapper }).result.current;
    const second = renderHook(() => useQueryClient(), { wrapper }).result.current;

    expect(first).toBe(second);
  });
});
