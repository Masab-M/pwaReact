import React, { useEffect, useState } from 'react'

export default function Location() {
    const [location, setLocation] = useState(null)
    useEffect(() => {
        getNavigation()
    }, [])
    async function getNavigation() {
        navigator.geolocation.getCurrentPosition(async position => {
            setLocation(position)
        }, error => {
            console.error(error)
            setLocation(false)
        }, {
            timeout: 2000,
            maximumAge: 20000,
            enableHighAccuracy: true
        })
    }
    console.log(location);
    function timeConverter(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
        return time;
    }
    return (
        <>
            <div className="locationDetails">
                {
                    location
                        ?
                        <>
                            <div className="timestamp">
                                <span>Last Updated: </span>
                                <span>{timeConverter(location.timestamp)}</span>
                            </div>
                            <div className="location">
                                <div className="Longitude">
                                    <span>Longitude: </span>
                                    <span>{location.coords.longitude}</span>
                                </div>
                                <div className="Latitude">
                                    <span>Longitude: </span>
                                    <span>{location.coords.latitude}</span>
                                </div>
                            </div>
                            <div className="LocationDetails">
                                <div className="ld">
                                    <span>Accuracy: </span>
                                    <span>{location.coords.accuracy}</span>
                                </div>
                            </div>
                        </>
                        :
                        <div className="LocationErr">
                            <span>Permission Denied or Location Error</span>
                        </div>
                }
            </div>
        </>
    )
}
