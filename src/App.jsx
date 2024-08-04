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
import {FiLogOut} from "react-icons/fi"
import firebase from './Utils/Firebase';
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier, signOut } from "firebase/auth";
function App() {
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(null)
  const [loginSuccess, setLoginSuccess] = useState(null)
  const [countryCode, setCountryCode] = useState([])
  const [phoneCode, setPhoneCode] = useState('')
  function getCountryCodes() {
    
    fetch('https://restcountries.com/v3.1/all').then((response)=> response.json()).then(async (data)=>{
    console.log(data);
    setCountryCode(data)
    const cache = await caches.open("my-cache");
    await cache.put('CountryCode-data', new Response(JSON.stringify(data)));
    }).catch((err)=>{
      console.error(err);
    })
  }
  useEffect(() => {
    getCountryCodes()
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
        localStorage.removeItem('uid');
        localStorage.removeItem('email');
        setIsLoggedIn(false)
        console.log('logout');
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
  const [logoutPopup, setLogoutPopup] = useState(false)
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
  const handleLogOutConfirmClose = () => {
    setLogoutPopup(false);
  };
  const handleLogOutConfirmShow = () => {
    setLogoutPopup(true);
  };
  const handleLoginChoiceChange = (event) => {
    setFormError('')
    setLoginChoice(event.target.value);
  };
  
  async function handleEmailLink(e) {
    setLoading(true)
    e.preventDefault();
    if (e.target[0].value) {
      if (isValidEmail(e.target[0].value)) {
        setFormError('')
        try {
          await sendSignInLinkToEmail(auth,e.target[0].value, {
            url: 'http://localhost:3000/feed',
            handleCodeInApp: true,
          });
          window.localStorage.setItem('emailForSignIn', e.target[0].value);
          setEntrySuccess({ ...entrySuccess, link: true })
        setLoading(false)
        setTimeout(() => {
          handleLoginClose()
        }, 3000); 
        } catch (error) {
        setLoading(false)
        setFormError("Try Login with Phone, Email Link is Exceeded")
          console.error(error);
        }

      }
      else {
        setFormError('Email Invalid')
        setLoading(false)
      }
    }
    else {
      setLoading(false)
      setFormError('Fill Email First')
    }
  }
  async function handlePhoneOtp(e) {
    setLoading(true)
    e.preventDefault();
    if (e.target[1].value!=="" && e.target[0].value!=="") {
      if (validatePhoneNumber(e.target[1].value)) {
        setFormError('')
        console.log(phoneCode+e.target[1].value);
        onSignUpPhone(phoneCode+e.target[1].value)
      }
      else {
        setLoading(false)
        setFormError('Phone Number Invalid')
      }
    }
    else {
      if(e.target[1].value==="")
      {
        setFormError("Fill Number First")
      }
      if(e.target[0].value==="")
      {
        setFormError("Fill Country Code First")
      }
      setLoading(false)
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
        setFormError('')
        setLoading(false)
      }).catch((error) => {
        // Error; SMS not sent
        setLoading(false)
        setFormError('Phone Number Invalid')
        console.error(error);
      });
  }
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  function validatePhoneNumber(phoneNumber) {
    console.log(phoneNumber);
    const regex = /^\d{10,12}$/;
    return regex.test(phoneNumber);
  }
  function handleConfirmEmail(e) {
    setLoading(true)
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
        setLoading(false)
        }).catch((err) => {
          handleEmailConfirmClose()
          setIsLoggedIn(false)
          setLoading(false)
          setLoginSuccess(false)
          console.error('Error from catch', err);
        })
      }
      else {
        setLoading(false)

        setFormError('Email Invalid')
      }
    }
    else {
      setFormError("Fill Email to Confirm Login")
    }
  }
  function onOTPVerify(e){
    setLoading(true)
    e.preventDefault()
    if(e.target[0].value!=='')
    {
      window.confirmationResult.confirm(e.target[0].value).then(async(res)=>{
        localStorage.setItem('uid', res.user.uid);
        localStorage.setItem('email', res.user.email);
        setIsLoggedIn(true)
        setLoginSuccess(true)
        handleLoginClose()
        setLoading(false)
      }).catch((err)=>{
        console.error(err);
        setFormError('OTP Invalid')
        setIsLoggedIn(false)
        setLoginSuccess(false)
        setLoading(false)
      })
    }
    else{
      setLoading(false)
      setFormError('Enter OTP First')
    }
  } 
  function logoutUser(){
    signOut(auth).then(() => {
      localStorage.removeItem('uid')
      localStorage.removeItem('email')
      setIsLoggedIn(false)
      handleLogOutConfirmClose()
    }).catch((error) => {
      console.error(error);
    });
  }
  function clearConfirm(){
    setIsLoggedIn(false)
    setLoading(false)
    setLoginSuccess(false)
  }
  function getCountryCode(e){
    setPhoneCode(e.target.value);
  }
  return (
    <>
    <Modal show={logoutPopup}  handleClose={handleLogOutConfirmClose}>
    <div className="deleteModal">
                    <div className="Instructions">
                        <p>Are you sure want to Log out?</p>
                    </div>
                    <div className="confirmbuttons">
                        <button onClick={handleLogOutConfirmClose}>Cancel</button>
                        <button onClick={() => {
logoutUser()
                        }}>Log Out</button>
                    </div>
                </div>
    </Modal>
      <Modal show={emailConfirmPopup} clearConfirm={clearConfirm} handleClose={handleEmailConfirmClose}>
        <div className="ConfirmEmail">
          <div className="confirmHeading">
            <h3>Confirm Email</h3>
          </div>
          <div className="emailForm">
            <form action="" onSubmit={handleConfirmEmail}>
              <div className="emailInput">
                <label htmlFor="emailConfirm">Login Email</label>
                <input  onChange={()=>{
                  setFormError('')
                }} type="text" name="emailConfirm" id="emailConfirm" placeholder='Please enter Your Email' />
                <div className="confirmButton">
                  <button onClick={handleEmailConfirmClose} type='button'>Cancel</button>
                  <button type='submit' >
                  {
                            loading&&
                            <div className="spinnerButton"></div>
                          }
                    Confirm Email</button>
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
                      <input  onChange={()=>{
                  setFormError('')
                }} type="text" name="emailAuthentication" id="emailAuthentication" />
                      <div className="FormErr">
                        {
                          formError !== '' &&
                          <span>{formError}</span>
                        }
                      </div>
                      <div className="sendLink">
                        <button disabled={loading}>
                          {
                            loading&&
                            <div className="spinnerButton"></div>
                          }
                          
                          Send Login Link</button>
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
                          <span>Email has been Sent, Check your inbox or Spam also</span>
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
                      <div className="phone-group">
                      <input list="weekday" onChange={getCountryCode}/>
                      <datalist name="" id="weekday" >  
                        <option value="">Select Country Code</option>
                        {
                          countryCode.map((c,i)=>
                          <option value={`${c.idd.root}${c.idd.suffixes?c.idd.suffixes[0]:c.idd.suffixes}`}  key={i}>{c.flag} {c.name.common} {c.idd.root}{c.idd.suffixes?c.idd.suffixes[0]:c.idd.suffixes}</option>  
                          )
                        }
                      </datalist>
                      <input onChange={()=>{
                  setFormError('')
                }} type="text" name="phoneNumber" id="phoneNumber" />
                      
                      </div>
                      <div className="FormErr">
                        {
                          formError !== '' &&
                          <span>{formError}</span>
                        }
                      </div>
                      <div className="sendOtp">
                        <button>
                        {
                            loading&&
                            <div className="spinnerButton"></div>
                          }
                          
                          Send Otp</button>
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
                              <input onChange={()=>{
                  setFormError('')
                }} type="text" name="otp" id="otp" placeholder='OTP' />
                              <div className="FormErr">
                        {
                          formError !== '' &&
                          <span>{formError}</span>
                        }
                      </div>
                              <div className="verifyOtpButton">
                                <button>
                                {
                            loading&&
                            <div className="spinnerButton"></div>
                          }
                                  Verify Otp</button>
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
          {
            isLoggedIn &&
          <div className="Logout">
            <button onClick={handleLogOutConfirmShow}>
              <span>Logout</span>
              <FiLogOut/>
            </button>
          </div>
          }
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
