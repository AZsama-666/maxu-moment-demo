import { Link } from 'react-router-dom';

export function PageHeader({
  title,
  backTo,
}: {
  title: string;
  backTo?: string;
}) {
  return (
    <header className="page-header">
      {backTo ? (
        <Link to={backTo} className="page-header__back" aria-label="返回">
          ‹
        </Link>
      ) : (
        <span className="page-header__spacer" />
      )}
      <h1>{title}</h1>
      <span className="page-header__spacer" />
    </header>
  );
}
