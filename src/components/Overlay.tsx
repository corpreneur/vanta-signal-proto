interface OverlayProps {
  visible: boolean;
  onClick: () => void;
}

const Overlay = ({ visible, onClick }: OverlayProps) => {
  return (
    <div
      onClick={onClick}
      className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    />
  );
};

export default Overlay;
