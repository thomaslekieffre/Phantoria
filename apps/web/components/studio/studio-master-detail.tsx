import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  error?: string | null;
  sidebar: ReactNode;
  editor: ReactNode;
  footer?: ReactNode;
};

export function StudioMasterDetail({ title, description, error, sidebar, editor, footer }: Props) {
  return (
    <div className="studio-md">
      <h2 className="studio-section__title">{title}</h2>
      <p className="studio-section__desc">{description}</p>
      {error ? <p className="studio-events__error">{error}</p> : null}
      <div className="studio-md__layout">
        <aside className="studio-md__sidebar">{sidebar}</aside>
        <div className="studio-md__editor">
          {editor}
          {footer}
        </div>
      </div>
    </div>
  );
}

export function StudioMdToolbar({ children }: { children: ReactNode }) {
  return <div className="studio-md__toolbar">{children}</div>;
}

export function StudioMdSearch(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="search" className="studio-md__search" {...props} />;
}

export function StudioMdFilters({ children }: { children: ReactNode }) {
  return <div className="studio-md__filters">{children}</div>;
}

export function StudioMdListWrap({ children }: { children: ReactNode }) {
  return <div className="studio-md__list-wrap">{children}</div>;
}

export function StudioMdPlaceholder({ children }: { children: ReactNode }) {
  return <div className="studio-md__placeholder">{children}</div>;
}

export function StudioMdItemButton({
  active,
  onClick,
  title,
  meta,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  meta: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      className={`studio-md__item${active ? " studio-md__item--active" : ""}`}
      onClick={onClick}
    >
      <span className="studio-md__item-name">{title}</span>
      <span className="studio-md__item-meta">{meta}</span>
      {sub ? <span className="studio-md__item-key">{sub}</span> : null}
    </button>
  );
}
