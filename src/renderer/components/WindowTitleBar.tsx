interface WindowTitleBarProps {
  platform: string;
}

export function WindowTitleBar({ platform }: WindowTitleBarProps) {
  return (
    <div className="window-titlebar" data-platform={platform} role="presentation">
      <div className="window-titlebar-drag">
        <span className="window-titlebar-title">POK</span>
      </div>
    </div>
  );
}
