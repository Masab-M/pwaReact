import React from "react";
import './Modal.css'
export default function Modal({ handleClose, show, children }) {
    const showHideClassName = show
        ? "modal display-block"
        : "modal display-none";
    return (
        <>
            <div className={showHideClassName}>
                <div className={`modalOverlay ${showHideClassName}`} onClick={handleClose}></div>
                <section className="modal-main">
                    <div className="modalSection">
                        <div className="modalInnerDiv">
                            {children}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}