import { NavLink } from 'react-router';
import { journalPath } from '../../app/paths';
import { getCourses, getModuleTree } from './courseCatalog';
import type { ModuleNode } from './courses.types';

interface CourseSidebarProps {
  /** Called after a topic link is chosen, so drawers can close. */
  onNavigate?: () => void;
}

export function CourseSidebar({ onNavigate }: CourseSidebarProps) {
  return (
    <nav aria-label="Courses" className="course-nav">
      {getCourses().map((course) => (
        <section key={course.id} className="course-nav__course" aria-labelledby={`course-${course.id}`}>
          <h2 id={`course-${course.id}`} className="course-nav__course-title">
            {course.title}
          </h2>
          <ModuleList nodes={getModuleTree(course.id)} depth={0} onNavigate={onNavigate} />
        </section>
      ))}
    </nav>
  );
}

function ModuleList({ nodes, depth, onNavigate }: { nodes: ModuleNode[]; depth: number; onNavigate?: (() => void) | undefined }) {
  return (
    <ul className="course-nav__modules" data-depth={depth}>
      {nodes.map((node) => (
        <li key={node.module.id}>
          <p className="course-nav__module">{node.module.title}</p>
          {node.modules.length > 0 && <ModuleList nodes={node.modules} depth={depth + 1} onNavigate={onNavigate} />}
          {node.topics.length > 0 && (
            <ul className="course-nav__topics">
              {node.topics.map((topic) => (
                <li key={topic.id}>
                  <NavLink to={journalPath(topic.id)} className="course-nav__topic" onClick={onNavigate}>
                    {topic.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
