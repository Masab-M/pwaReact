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
import { getAuth, sendSignInLinkToEmail,isSignInWithEmailLink,signInWithEmailLink } from "firebase/auth";
function App() {
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
        email = window.prompt('Please provide your email for confirmation');
      }
      // The client SDK will parse the code from the link for you.
      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          // Clear email from storage.
          window.localStorage.removeItem('emailForSignIn');
          console.log(result);
          // You can access the new user via result.user
          // Additional user info profile not available via:
          // result.additionalUserInfo.profile == null
          // You can check if the user is new or existing:
          // result.additionalUserInfo.isNewUser
        })
        .catch((error) => {
          console.error(error);
          // Some error occurred, you can inspect the code: error.code
          // Common errors could be invalid email and invalid or expired OTPs.
        });
    }
    console.log('done');
  }, [])
  
  const auth = getAuth();
  const [LoginPopup, setLoginPopup] = useState(false)
  const [loginChoice, setLoginChoice] = useState(null)
  const [entrySuccess, setEntrySuccess] = useState({
    link:null,
    otp:null
  })
  const [formError, setFormError] = useState(false)
  const handleLoginClose = () => {
    setLoginPopup(false);
    setLoginChoice(null)
    setEntrySuccess({link:null,otp:null})
  };
  const handleLoginShow = () => {
    setLoginPopup(true);
  };
  const handleLoginChoiceChange = (event) => {
    setFormError('')
    setLoginChoice(event.target.value);
  };
  async function handleEmailLink(e) {
    e.preventDefault();
    if(e.target[0].value){
      if(isValidEmail(e.target[0].value)){
        setFormError('')
        try {
          await sendSignInLinkToEmail(auth,e.target[0].value, {
            url: 'https://pwa-react-tau.vercel.app/feed',
            handleCodeInApp: true,
          });
          window.localStorage.setItem('emailForSignIn', e.target[0].value);
          setEntrySuccess({...entrySuccess,link:true})
        } catch (error) {
          console.error(error);
        }

      }
      else{
          setFormError('Email Invalid')
      }
    }
    else{
      setFormError('Fill Email First')
    }
  }
  function handlePhoneOtp(e) {
    e.preventDefault();
    if(e.target[0].value){
      if(validatePhoneNumber(e.target[0].value)){
        setFormError('')
        setEntrySuccess({...entrySuccess,otp:true})
      }
      else{
        setFormError('Phone Number Invalid')
      }
    }
    else{
      setFormError("Fill Number First")
    }
  }
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  function validatePhoneNumber(phoneNumber) {
    const regex = /^(?:\+\d{0,12}|\d{0,10})$/;
    return regex.test(phoneNumber);
  }
  return (
    <>
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
                  !entrySuccess.link===true &&
                  <form action="" onSubmit={handleEmailLink}>
                  <div className="EmailInput">
                    <label htmlFor="">Email</label>
                    <input type="text" name="emailAuthentication" id="emailAuthentication" />
                      <div className="FormErr">
                    {
                      formError!=='' &&
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
                !entrySuccess.otp===true &&
                <form action="" onSubmit={handlePhoneOtp}>
                <div className="PhoneInput">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input type="text" name="phoneNumber" id="phoneNumber" />
                  <div className="FormErr">
                  {
                    formError!=='' &&
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
                    entrySuccess.otp===true &&
                    <div className="phoneSuccess">
                      <div className="VerifyOtp">
                        <input type="text" name="otp" id="otp" placeholder='OTP' />
                        <div className="verifyOtpButton">
                          <button>Verify Otp</button>
                        </div>
                      </div>
                    </div>
                  }
                  {
                    entrySuccess.otp===false &&
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
          <div className='LoginButtons'>
            <button onClick={handleLoginShow}>Login</button>
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
            <Route path="feed" element={<Feed />} />
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
