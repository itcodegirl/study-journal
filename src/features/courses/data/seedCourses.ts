import type { Course, CourseModule, Topic } from '../courses.types';

// Phase 1 ships one realistic path. Catalog ids are readable, stable slugs;
// learner-created objects use UUIDs.

export const courses: readonly Course[] = [
  { id: 'frontend-development', title: 'Frontend Development', slug: 'frontend-development' },
];

export const courseModules: readonly CourseModule[] = [
  { id: 'react-fundamentals', courseId: 'frontend-development', title: 'React Fundamentals', order: 1 },
  { id: 'react-state', courseId: 'frontend-development', parentModuleId: 'react-fundamentals', title: 'State', order: 1 },
];

export const topics: readonly Topic[] = [
  {
    id: 'what-is-state',
    moduleId: 'react-state',
    title: 'What is state?',
    order: 1,
    sourceUrl: 'https://react.dev/learn/state-a-components-memory',
  },
  {
    id: 'props',
    moduleId: 'react-state',
    title: 'Props',
    order: 2,
    sourceUrl: 'https://react.dev/learn/passing-props-to-a-component',
  },
  {
    id: 'state-derived-from-props',
    moduleId: 'react-state',
    title: 'State derived from props',
    order: 3,
    sourceUrl: 'https://react.dev/learn/choosing-the-state-structure#avoid-redundant-state',
  },
  {
    id: 'effects',
    moduleId: 'react-state',
    title: 'Effects',
    order: 4,
    sourceUrl: 'https://react.dev/learn/synchronizing-with-effects',
  },
];
