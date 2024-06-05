import ReactDOM from "react-dom";
import "./Modal.scss";
import { ReactElement } from "react";

const Modal = ({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) => {
  if (!isOpen) return <></>;

  return ReactDOM.createPortal(
    <div className="ks-lw-modal-overlay">
      <div className="ks-lw-modal-content">{children}</div>
    </div>,
    // already created in Widget/index.ts
    document.getElementById("ks-lw-modal-root")!
  ) as ReactElement;
};

export default Modal;
