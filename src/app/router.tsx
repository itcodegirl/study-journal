import { Navigate, type RouteObject } from 'react-router';
import { getDefaultTopicId } from '../features/courses/courseCatalog';
import { JournalPage, TopicNotFound } from '../features/journal/JournalPage';
import { AppShell } from './AppShell';
import { journalPath } from './paths';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, element: <Navigate to={journalPath(getDefaultTopicId())} replace /> },
      { path: 'journal/:topicId', Component: JournalPage },
      { path: '*', Component: TopicNotFound },
    ],
  },
];
