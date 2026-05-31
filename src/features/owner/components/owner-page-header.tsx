import Link from "next/link";

type OwnerPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  divider?: boolean;
};

export function OwnerPageHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
  divider = false,
}: OwnerPageHeaderProps) {
  return (
    <header className={`tx-page-header${divider ? " tx-page-header-divider" : ""}`}>
      <div className="min-w-0">
        {backHref && (
          <Link href={backHref} className="tx-breadcrumb">
            ← {backLabel}
          </Link>
        )}
        <p className="tx-section-header mb-1">{eyebrow}</p>
        <h1 className="tx-page-title">{title}</h1>
        {description && <p className="tx-page-desc">{description}</p>}
      </div>
      {actions && <div className="tx-page-header-actions">{actions}</div>}
    </header>
  );
}
