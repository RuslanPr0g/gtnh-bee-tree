import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { DEFAULT_BEE, beePath } from '../links';

export function NotFound({ children = 'Nothing here.' }: { children?: ReactNode }) {
  return (
    <div className="notfound">
      {children}{' '}
      <Link className="qlink" to={beePath(DEFAULT_BEE)}>
        Go to the bee list
      </Link>
    </div>
  );
}
