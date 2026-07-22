import { Plus } from "lucide-react";
import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  full?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  full = false,
  icon,
  size = "md",
  trailingIcon,
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  const classes = [
    size === "sm" ? "small-button" : "button",
    variant === "primary" ? "button-primary" : "",
    variant === "secondary" ? "button-secondary" : "",
    variant === "danger" ? "button-danger" : "",
    variant === "ghost" ? "button-ghost" : "",
    size === "lg" ? "button-lg" : "",
    full ? "button-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type={type} {...props}>
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export function IconButton({ children, className = "", label, type = "button", ...props }: IconButtonProps) {
  return (
    <button aria-label={label} className={`icon-button ${className}`.trim()} title={label} type={type} {...props}>
      {children}
    </button>
  );
}

type BrandButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
};

export function BrandButton({ children, className = "", icon, type = "button", ...props }: BrandButtonProps) {
  return (
    <button className={`brand-button ${className}`.trim()} type={type} {...props}>
      <span className="brand-mark">{icon}</span>
      <span>{children}</span>
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function IconTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`icon-tile ${className}`.trim()}>{children}</span>;
}

export function ActionCard({ body, icon, title }: { body: string; icon: ReactNode; title: string }) {
  return (
    <Card className="action-card">
      <IconTile>{icon}</IconTile>
      <h3>{title}</h3>
      <p>{body}</p>
    </Card>
  );
}

export function StatusLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="status-line">
      <IconTile>{icon}</IconTile>
      <div>
        <strong>{label}</strong>
        <small>{value}</small>
      </div>
    </div>
  );
}

export function MetricCard({ label, value, icon }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="metric-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <IconTile className="metric-icon">{icon}</IconTile>
    </Card>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={`panel ${className}`.trim()}>{children}</Card>;
}

export function PanelHeader({
  action,
  icon,
  title,
}: {
  action?: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <IconTile>{icon}</IconTile>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  actionLabel,
  body,
  icon,
  onAction,
  title,
}: {
  actionLabel?: string;
  body: string;
  icon: ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div className="empty-state">
      <IconTile>{icon}</IconTile>
      <strong>{title}</strong>
      <p>{body}</p>
      {actionLabel && onAction ? (
        <Button icon={<Plus size={16} />} onClick={onAction} size="sm" variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  wrapperClassName = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  wrapperClassName?: string;
}) {
  return (
    <label className={wrapperClassName}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function SelectField({
  children,
  label,
  wrapperClassName = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  label: string;
  wrapperClassName?: string;
}) {
  return (
    <label className={wrapperClassName}>
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function TextareaField({
  label,
  wrapperClassName = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  wrapperClassName?: string;
}) {
  return (
    <label className={wrapperClassName}>
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}
