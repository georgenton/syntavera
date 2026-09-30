export function PortalEmpty({ title, body }: { title: string; body: string }) {
  return <div className="portal-empty"><span aria-hidden="true">◇</span><h2>{title}</h2><p>{body}</p></div>;
}
