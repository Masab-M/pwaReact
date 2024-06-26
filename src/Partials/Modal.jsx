import React from "react";
import './Modal.css'
import { RxCross2 } from "react-icons/rx"
export default function Modal({ handleClose, show, children, clearImage }) {
    const showHideClassName = show
        ? "modal display-block"
        : "modal display-none";
    return (
        <>
            <div className={showHideClassName}>
                <div id="recaptcha-container">
                </div>
                <div className={`modalOverlay ${showHideClassName}`} onClick={() => {
                    handleClose()
                    if (clearImage) {
                        clearImage()
                    }
                }}></div>
                <section className="modal-main">
                    <div className="closeIcon" onClick={() => {
                        handleClose()
                        if (clearImage) {
                            clearImage()
                        }
                    }}>
                        <RxCross2 />
                    </div>
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