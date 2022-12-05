import React, {useEffect, useState} from "react";
import {ActivePage} from "../utils/ActivePage";

function SearchPage() {

    const [coords, setCoords] = useState({x: 0, y: 0});
    const [globalCoords, setGlobalCoords] = useState({x: 0, y: 0});

    const [activePage, setActivePage] = useState<ActivePage>(ActivePage.HOME);

    useEffect(() => {
        const handleWindowMouseMove = (event: any) => {
            setGlobalCoords({
                x: event.screenX,
                y: event.screenY,
            });
        };
        window.addEventListener('mousemove', handleWindowMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
        };
    }, []);

    const handleMouseClick = (event: any) => {
        setCoords({
            x: event.clientX - event.target.offsetLeft,
            y: event.clientY - event.target.offsetTop,
        });
    };

    return (
        <div className="App">

        <img className={"w-128"} src={"https://cdn-1.motorsport.com/images/mgl/0mb95oa2/s800/lewis-hamilton-mercedes-1.jpg"} alt={"Test Image"} onClick={handleMouseClick}>

        </img>

        <h2>
        Coords: {coords.x} {coords.y}
    </h2>

    <hr/>

    <h2>
        Global coords: {globalCoords.x} {globalCoords.y}
    </h2>
    </div>
);
}

export default SearchPage;