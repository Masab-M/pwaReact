import React from "react";
import './Modal.css'
import { RxCross2 } from "react-icons/rx"
export default function Modal({ handleClose, show, children, clearImage ,clearConfirm}) {
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
                    if(clearConfirm)
                    {
                        clearConfirm()
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