import './Details.css';
import { useEffect, useState, } from 'react';
import { useParams } from 'react-router-dom';
import recipieAPI from '../api/recipies-api';
import Comments from './Comments';

export default function Recipie() {
    const [recipie, setRecipie] = useState({});
    const { recipieId } = useParams();

    useEffect(() => {
        (async () => {
            const result = await recipieAPI.getOne(recipieId);

            setRecipie(result);
        })();
    });

    return (
        <>
            <div className="recipe-card-details">
                <img className="details-img" src={recipie.image} alt="Recipie image" />
                <h2>{recipie.name}</h2>
                <p>{recipie.description}</p>
                <h2>Ingredients:</h2>
                <p>{recipie.Ingredients}</p>
                <h2>Instructions:</h2>
                <p>{recipie.Instructions}</p>
            </div>
            <div>
            <Comments />
            </div>
        </>
    );
}