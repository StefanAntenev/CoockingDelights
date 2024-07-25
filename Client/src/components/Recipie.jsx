import './Recipie.css';
import { Link } from 'react-router-dom';

export default function Recipie({
    _id,
    name,
    image,
    description,
    Ingredients,
    Instructions
}) {



    return (
        <div className="recipe-card">
            <Link to={`/recipies/${_id}/details`}>
                <img src={image} alt="Recipie image" />
            </Link>
            <h2>{name}</h2>
            <p>{description}</p>
            <Link to={`/recipies/${_id}/details`} className="detailsBtn">details</Link>
        </div>
    );
}
