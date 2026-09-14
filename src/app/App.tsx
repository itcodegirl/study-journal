import type { ComponentProps } from 'react';
import { RouterProvider } from 'react-router';
import { RepositoriesProvider, type Repositories } from '../services/repositories';

interface AppProps {
  repositories: Repositories;
  router: ComponentProps<typeof RouterProvider>['router'];
}

export function App({ repositories, router }: AppProps) {
  return (
    <RepositoriesProvider repositories={repositories}>
      <RouterProvider router={router} />
    </RepositoriesProvider>
  );
}
