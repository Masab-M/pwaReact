import React, { Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

import './App.css';
import "./Assets/CSS/index.app.css"
import Logo from "./Assets/Images/Progressive_Web_Apps_Logo.svg.png"

import { BiHomeAlt2, BiCurrentLocation } from "react-icons/bi"
import { CgFeed } from "react-icons/cg"
import Location from "./View/Location"
import Home from './View/Home'
import Feed from './View/Feed'
import Modal from './Partials/Modal';
import firebase from './Utils/Firebase';
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(null)
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Additional state parameters can also be passed via URL.
      // This can be used to continue the user's intended action before triggering
      // the sign-in operation.
      // Get the email if available. This should be available if the user completes
      // the flow on the same device where they started it.
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        handleEmailConfirmShow()
      }
      else {
        // The client SDK will parse the code from the link for you.
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            // Clear email from storage.
            window.localStorage.removeItem('emailForSignIn');
            console.log(result);
            localStorage.setItem('uid', result.user.uid);
            localStorage.setItem('email', result.user.email);
            setIsLoggedIn(true)
            setLoginSuccess(true)
            // You can access the new user via result.user
            // Additional user info profile not available via:
            // result.additionalUserInfo.profile == null
            // You can check if the user is new or existing:
            // result.additionalUserInfo.isNewUser
          })
          .catch((error) => {
            console.error(error);
            setIsLoggedIn(false)
            setLoginSuccess(false)
            // Some error occurred, you can inspect the code: error.code
            // Common errors could be invalid email and invalid or expired OTPs.
          });
      }
    }
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        localStorage.setItem('uid', user.uid);
        localStorage.setItem('email', user.email);
        setIsLoggedIn(true)
        // ...
      } else {
        setIsLoggedIn(false)
      }
    });
  }, [])
  async function handleSignInEmail(email) {
    // The client SDK will parse the code from the link for you.
    return await signInWithEmailLink(auth, email, window.location.href);
  }
  const auth = getAuth();
  const [LoginPopup, setLoginPopup] = useState(false)
  const [loginChoice, setLoginChoice] = useState(null)
  const [emailConfirmPopup, setEmailConfirmPopup] = useState(false)
  const [entrySuccess, setEntrySuccess] = useState({
    link: null,
    otp: null
  })
  const [formError, setFormError] = useState(false)
  const handleLoginClose = () => {
    setLoginPopup(false);
    setLoginChoice(null)
    setEntrySuccess({ link: null, otp: null })
  };
  const handleLoginShow = () => {
    setLoginPopup(true);
  };
  const handleEmailConfirmClose = () => {
    setEmailConfirmPopup(false);
  };
  const handleEmailConfirmShow = () => {
    setEmailConfirmPopup(true);
  };
  const handleLoginChoiceChange = (event) => {
    setFormError('')
    setLoginChoice(event.target.value);
  };
  async function handleEmailLink(e) {
    e.preventDefault();
    if (e.target[0].value) {
      if (isValidEmail(e.target[0].value)) {
        setFormError('')
        try {
          await sendSignInLinkToEmail(auth, e.target[0].value, {
            url: 'http://localhost:3000/feed',
            handleCodeInApp: true,
          });
          window.localStorage.setItem('emailForSignIn', e.target[0].value);
          setEntrySuccess({ ...entrySuccess, link: true })
        } catch (error) {
          console.error(error);
        }

      }
      else {
        setFormError('Email Invalid')
      }
    }
    else {
      setFormError('Fill Email First')
    }
  }
  async function handlePhoneOtp(e) {
    e.preventDefault();
    if (e.target[0].value) {
      if (validatePhoneNumber(e.target[0].value)) {
        setFormError('')
        onSignUpPhone(e.target[0].value)
      }
      else {
        setFormError('Phone Number Invalid')
      }
    }
    else {
      setFormError("Fill Number First")
    }
  }
  async function onCaptchaVerify(email) {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          // ...
          onSignUpPhone(email)
          console.log(response);
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          // ...
        }
      },
        auth
      );
    }
  }
  function onSignUpPhone(email) {
    onCaptchaVerify(email)
    const appVerify = window.recaptchaVerifier
    signInWithPhoneNumber(auth, email, appVerify)
      .then((confirmationResult) => {
        // SMS sent. Prompt user to type the code from the message, then sign the
        // user in with confirmationResult.confirm(code).
        console.log(confirmationResult);
        window.confirmationResult = confirmationResult;
        setEntrySuccess({ ...entrySuccess, otp: true })
        // ...
      }).catch((error) => {
        console.error(error);
        // Error; SMS not sent
        // ...
      });
  }
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  function validatePhoneNumber(phoneNumber) {
    const regex = /^(?:\+\d{0,12}|\d{0,11})$/;
    return regex.test(phoneNumber);
  }
  function handleConfirmEmail(e) {
    e.preventDefault();
    if (e.target[0].value) {
      if (isValidEmail(e.target[0].value)) {
        setFormError('')
        handleSignInEmail(e.target[0].value).then((res) => {
          localStorage.setItem('uid', res.user.uid);
          localStorage.setItem('email', res.user.email);
          setIsLoggedIn(true)
          handleEmailConfirmClose()
          setLoginSuccess(true)
        }).catch((err) => {
          handleEmailConfirmClose()
          setIsLoggedIn(false)
          setLoginSuccess(false)
          console.error('Error from catch', err);
        })
      }
      else {
        setFormError('Email Invalid')
      }
    }
    else {
      setFormError("Fill Email to Confirm Login")
    }
  }
  function onOTPVerify(e){
    e.preventDefault()
    if(e.target[0].value!=='')
    {
      window.confirmationResult.confirm(e.target[0].value).then(async(res)=>{
        localStorage.setItem('uid', res.user.uid);
        localStorage.setItem('email', res.user.email);
        setIsLoggedIn(true)
        setLoginSuccess(true)
        handleLoginClose()
      }).catch((err)=>{
        console.error(err);
        setFormError('OTP Invalid')
        setIsLoggedIn(false)
        setLoginSuccess(false)
      })
    }
    else{
      setFormError('Enter OTP First')
    }
  }
  return (
    <>
      <Modal show={emailConfirmPopup} handleClose={handleEmailConfirmClose}>
        <div className="ConfirmEmail">
          <div className="confirmHeading">
            <h3>Confirm Email</h3>
          </div>
          <div className="emailForm">
            <form action="" onSubmit={handleConfirmEmail}>
              <div className="emailInput">
                <label htmlFor="emailConfirm">Login Email</label>
                <input type="text" name="emailConfirm" id="emailConfirm" placeholder='Please enter Your Email' />
                <div className="confirmButton">
                  <button onClick={handleEmailConfirmClose} type='button'>Cancel</button>
                  <button type='submit'>Confirm Email</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Modal>
      <Modal show={LoginPopup} handleClose={handleLoginClose}>
        <div className="loginPopup">
          <div className="LoginHead">
            <h3>Login</h3>
          </div>
          <div className="LoginChoice">
            <div className="EmailAuth">
              <input type="radio" value={"byEmail"} checked={loginChoice === "byEmail"}
                onChange={handleLoginChoiceChange} name="loginChoice" id="emailAuth" hidden />
              <label htmlFor="emailAuth">By Email</label>
            </div>
            <div className="PhoneAuth">
              <input type="radio" value={"byPhone"} checked={loginChoice === "byPhone"}
                onChange={handleLoginChoiceChange} name="loginChoice" id="phoneAuth" hidden />
              <label htmlFor="phoneAuth">By Phone</label>

            </div>
          </div>
          <div className="ChoiceInput">
            {
              loginChoice === "byEmail" &&
              <div className="EmailField">
                {
                  !entrySuccess.link === true &&
                  <form action="" onSubmit={handleEmailLink}>
                    <div className="EmailInput">
                      <label htmlFor="">Email</label>
                      <input type="text" name="emailAuthentication" id="emailAuthentication" />
                      <div className="FormErr">
                        {
                          formError !== '' &&
                          <span>{formError}</span>
                        }
                      </div>
                      <div className="sendLink">
                        <button>Send Login Link</button>
                      </div>
                    </div>
                  </form>
                }

                {
                  entrySuccess.link !== null ?
                    <>
                      {
                        entrySuccess.link === true &&
                        <div className="EmailSuccess">
                          <span>Email has been Sent to this "", Check your inbox or Spam also</span>
                        </div>
                      }
                      {entrySuccess.link === false &&
                        <div className="EmailError">
                          <span>Email has not been Sent try again with Another Email</span>
                        </div>}
                    </>
                    : ""
                }
              </div>
            }
            {
              loginChoice === "byPhone" &&
              <div className="PhoneField">
                {
                  !entrySuccess.otp === true &&
                  <form action="" onSubmit={handlePhoneOtp}>
                    <div className="PhoneInput">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input type="text" name="phoneNumber" id="phoneNumber" />
                      <div className="FormErr">
                        {
                          formError !== '' &&
                          <span>{formError}</span>
                        }
                      </div>
                      <div className="sendOtp">
                        <button>Send Otp</button>
                      </div>
                    </div>
                  </form>
                }

                {
                  entrySuccess.otp !== null ?
                    <>
                      {
                        entrySuccess.otp === true &&
                        <form onSubmit={onOTPVerify}>
                          <div className="phoneSuccess">
                            <div className="VerifyOtp">
                              <input type="text" name="otp" id="otp" placeholder='OTP' />
                              <div className="verifyOtpButton">
                                <button>Verify Otp</button>
                              </div>
                            </div>
                          </div>
                        </form>
                      }
                      {
                        entrySuccess.otp === false &&
                        <div className="PhoneErr">
                          <span>Try Another Phone Number</span>
                        </div>
                      }
                    </>
                    :
                    ""
                }
              </div>
            }
          </div>
        </div>
        <div id="recaptcha-container">

</div>
      </Modal>
      <div className="App">
        <nav>
          <div className="logo">
            <img src={Logo} alt="" />
          </div>
          <div className="Navlinks">
            <ul className="navScreens">
              <li>
                <NavLink to="/">Home</NavLink>
              </li>
              <li>
                <NavLink to="/feed">Feed</NavLink>
              </li>
              <li>
                <NavLink to="/location">Locate</NavLink>
              </li>
            </ul>
          </div>
        </nav>
        <Suspense fallback={
          <>
            <div className="spinner"></div>
          </>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="location" element={<Location />} />
            <Route path="feed" element={<Feed isLogin={isLoggedIn} LoginPopup={handleLoginShow} loginSuccess={loginSuccess} />} />
          </Routes>
        </Suspense>
        <div className="AppNav">
          <div className="AppMenus">
            <div className="Menulist">
              <div className="AppScreeen">
                <NavLink to={'/location'}>
                  <BiCurrentLocation />
                </NavLink>
              </div>
              <div className="AppScreeen">
                <NavLink to={'/'}>
                  <BiHomeAlt2 />
                </NavLink>
              </div>
              <div className="AppScreeen">
                <NavLink to={'/feed'}>
                  <CgFeed />
                </NavLink>
              </div>
            </div>
          </div>
        </div>
 
      </div>
     
    </>
  );
}

export default App;
