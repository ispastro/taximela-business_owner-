type OwnerSectionProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function OwnerSection({
  title,
  description,
  action,
  children,
  className = "",
}: OwnerSectionProps) {
  return (
    <section className={`tx-section ${className}`.trim()}>
      <div className="tx-section-header-row">
        <div>
          <p className="tx-section-header">{title}</p>
          {description && (
            <p className="tx-page-desc" style={{ marginTop: "2px" }}>
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
