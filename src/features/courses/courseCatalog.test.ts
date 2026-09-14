import { describe, expect, it } from 'vitest';
import { getDefaultTopicId, getModuleTree, getTopicTrail } from './courseCatalog';
import { courseModules, courses, topics } from './data/seedCourses';

describe('course catalog', () => {
  it('uses unique ids across courses, modules, and topics', () => {
    const ids = [...courses, ...courseModules, ...topics].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves the vertical-slice topic to its full course path', () => {
    const trail = getTopicTrail('state-derived-from-props');
    expect(trail?.course.title).toBe('Frontend Development');
    expect(trail?.modules.map((module) => module.title)).toEqual(['React Fundamentals', 'State']);
    expect(trail?.topic.title).toBe('State derived from props');
    expect(trail?.topic.sourceUrl).toMatch(/^https:\/\/react\.dev\//);
  });

  it('returns undefined for topics that are not in the catalog', () => {
    expect(getTopicTrail('not-a-topic')).toBeUndefined();
  });

  it('builds the navigation tree in catalog order', () => {
    const [reactFundamentals] = getModuleTree('frontend-development');
    expect(reactFundamentals?.module.title).toBe('React Fundamentals');
    const [state] = reactFundamentals?.modules ?? [];
    expect(state?.module.title).toBe('State');
    expect(state?.topics.map((topic) => topic.title)).toEqual([
      'What is state?',
      'Props',
      'State derived from props',
      'Effects',
    ]);
  });

  it('opens new learners on the first topic', () => {
    expect(getDefaultTopicId()).toBe('what-is-state');
  });
});
