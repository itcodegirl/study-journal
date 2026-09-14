import type { Course, CourseModule, ModuleNode, Topic, TopicTrail } from './courses.types';
import { courseModules, courses, topics } from './data/seedCourses';

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export function getCourses(): readonly Course[] {
  return courses;
}

export function getTopic(topicId: string): Topic | undefined {
  return topics.find((topic) => topic.id === topicId);
}

function getModule(moduleId: string): CourseModule | undefined {
  return courseModules.find((module) => module.id === moduleId);
}

export function getTopicTrail(topicId: string): TopicTrail | undefined {
  const topic = getTopic(topicId);
  if (!topic) return undefined;

  const modules: CourseModule[] = [];
  let module = getModule(topic.moduleId);
  while (module) {
    modules.unshift(module);
    module = module.parentModuleId ? getModule(module.parentModuleId) : undefined;
  }

  const course = courses.find((candidate) => candidate.id === modules[0]?.courseId);
  return course ? { course, modules, topic } : undefined;
}

function buildModuleNode(module: CourseModule): ModuleNode {
  return {
    module,
    modules: courseModules
      .filter((child) => child.parentModuleId === module.id)
      .sort(byOrder)
      .map(buildModuleNode),
    topics: topics.filter((topic) => topic.moduleId === module.id).sort(byOrder),
  };
}

export function getModuleTree(courseId: string): ModuleNode[] {
  return courseModules
    .filter((module) => module.courseId === courseId && !module.parentModuleId)
    .sort(byOrder)
    .map(buildModuleNode);
}

/** The first topic in catalog order: where a brand-new learner lands. */
export function getDefaultTopicId(): string {
  const [firstCourse] = courses;
  const findFirstTopic = (nodes: ModuleNode[]): Topic | undefined => {
    for (const node of nodes) {
      const topic = findFirstTopic(node.modules) ?? node.topics[0];
      if (topic) return topic;
    }
    return undefined;
  };
  const topic = firstCourse ? findFirstTopic(getModuleTree(firstCourse.id)) : undefined;
  if (!topic) throw new Error('The course catalog has no topics.');
  return topic.id;
}
