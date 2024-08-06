import './LatestRecipie.css';

import './Recipie.css';
import { Link } from 'react-router-dom';

export default function LatestRecipie({
    _id,
    name,
    image,
    description,
}) {
    return (
        <div className="recipe-card">
            <Link to={`/recipies/${_id}/details`}>
                <img src={image} alt="Recipie image" />
            </Link>
            <h2>{name}</h2>
            <p>{description}</p>
            <Link to={`/recipies/${_id}/details`} ><button className="detailsBtn2">details</button></Link>
        </div>
    );
}
