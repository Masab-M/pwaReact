import React, { useEffect, useState } from 'react'

export default function Location() {
    const [location, setLocation] = useState()
    const [position, setPosition] = useState()
    useEffect(() => {
        findLocation()
    }, [])
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
    function findLocation() {
        navigator.geolocation.getCurrentPosition(async position => {
            setPosition(position)
            fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyACIbySi3LQJrBV9l55JAgM5k6Qy_2SW94`
            )
                .then((response) => response.json())
                .then(async (data) => {
                    if (data.status === 'OK') {
                        console.log(data);
                        const addressComponents = data.results[0].address_components;
                        const FormatedAddress = data.results[3].formatted_address;
                        let state = '';
                        let country = '';
                        let city="";
                        for (let i = 0; i < addressComponents.length; i++) {
                            const types = addressComponents[i].types;
                            if (types.includes('administrative_area_level_1')) {
                                state = addressComponents[i].long_name;
                            } else if (types.includes('country')) {
                                country = addressComponents[i].long_name;
                            }
                            else if (types.includes('locality')) {
                                city = addressComponents[i].long_name;
                            }
                        }
                        setLocation({state:state,country:country,address:FormatedAddress,city:city});
                        const cache = await caches.open("my-cache");
                        await cache.put('location-data', new Response(JSON.stringify(data)));

                    } else {
                        console.log('No results found.', data);
                    }
                })
                .catch(async (error) => {
                    console.log('Error occurred while geocoding:', error);
                });
        }, error => {
            getCacheLocation()
            
            console.error(error)
        }, {
            timeout: 2000,
            maximumAge: 20000,
            enableHighAccuracy: true
        })
    }
    async function getCacheLocation() {
        const cacheResponse = await caches.match('location-data');
        if (cacheResponse) {
            const cachedData = await cacheResponse.json();
            if (cachedData.status === 'OK') {
                const addressComponents = cachedData.results[0].address_components;
                let state = '';
                let country = '';
                let city="";
                const FormatedAddress = cachedData.results[3].formatted_address
                for (let i = 0; i < addressComponents.length; i++) {
                    const types = addressComponents[i].types;
                    if (types.includes('administrative_area_level_1')) {
                        state = addressComponents[i].long_name;
                    } else if (types.includes('country')) {
                        country = addressComponents[i].long_name;
                    } else if (types.includes('locality')) {
                        city = addressComponents[i].long_name;
                    }
                }
                
                setLocation({state:state,country:country,address:FormatedAddress,city:city});
            } else {
                console.log('No results found.', cachedData);
            }
        } else {
            console.log('No cached Location available');
        }
    }
    console.log(location);
    return (
        <>
            <div className="locationDetails">
                {
                    position
                        ?
                        <>
                            <div className="timestamp">
                                <span>Last Updated: </span>
                                <span>{timeConverter(position.timestamp)}</span>
                            </div>
                            <div className="location">
                                <div className="location_Details">
                                    <span>Longitude: </span>
                                    <span>{position?.coords.longitude}</span>
                                </div>
                                <div className="location_Details">
                                    <span>Longitude: </span>
                                    <span>{position?.coords.latitude}</span>
                                </div>
                            </div>
                            <div className="location">
                                <div className="location_Details">
                                    <span>State: </span>
                                    <span>{location.state}</span>
                                </div>
                                <div className="location_Details">
                                    <span>Country: </span>
                                    <span>{location.country}</span>
                                </div>
                            </div>
                            <div className="location">
                                <div className="location_Details">
                                    <span>City: </span>
                                    <span>{location.city}</span>
                                </div>
                              
                            </div>
                            <div className="location">
                                <div className="location_Details">
                                    <span>Address: </span>
                                    <span>{location.address}</span>
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
