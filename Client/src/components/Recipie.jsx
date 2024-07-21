import './Recipie.css';

import Details from './Details';

export default function Recipie({
    _id,
    name,
    image,
    description,
}) {



    return (
        <div className="recipe-card">
            <img src={image} alt="Recipie image" />
            <h2>{name}</h2>
            <p>{description}</p>
            <button className="detailsBtn" >Details</button>
        </div>
    );
}
