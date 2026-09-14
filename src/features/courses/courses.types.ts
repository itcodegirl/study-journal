export interface Course {
  id: string;
  title: string;
  slug: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  /** Modules nest one level: React Fundamentals → State. */
  parentModuleId?: string;
  title: string;
  order: number;
}

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  sourceUrl?: string;
}

export interface ModuleNode {
  module: CourseModule;
  modules: ModuleNode[];
  topics: Topic[];
}

/** Everything needed to place a topic: its course and module path from root to leaf. */
export interface TopicTrail {
  course: Course;
  modules: CourseModule[];
  topic: Topic;
}
