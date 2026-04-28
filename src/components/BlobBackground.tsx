export default function BlobBackground({ color1 = '#3b82f6', color2 = '#8b5cf6' }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      <div 
        className="blob -top-24 -left-24" 
        style={{ '--blob-color-1': color1, '--blob-color-2': color2 } as any} 
      />
      <div 
        className="blob -bottom-24 -right-24" 
        style={{ '--blob-color-1': color2, '--blob-color-2': color1 } as any} 
      />
    </div>
  );
}
