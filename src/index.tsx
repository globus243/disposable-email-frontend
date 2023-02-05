import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import imgBG from "./images/background.jpg";

interface imgStyleType {
    backgroundImage: string;
    backgroundPosition: string;
    backgroundSize: string;
    backgroundRepeat: string;
    width: string;
    height: string;
}

const imgStyle: imgStyleType = {
    backgroundImage: `url(${ imgBG })`,
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    width: "100vw",
    height: "100vh",
};

const root = ReactDOM.createRoot(
    document.getElementById( 'root' ) as HTMLElement
);
root.render(
    <div style={ imgStyle }>
        <App/>
    </div>
);