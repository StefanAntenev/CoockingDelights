import './Recipie.css';

import Details from './Details';

export default function Recipie(props) {



    return (
        <div className="recipe-card">
            <img src={props.img} alt="Recipie image" />
            <h2>{props.name}</h2>
            <p>{props.description}</p>
            <button className="detailsBtn" >Details</button>
        </div>
    );
}
