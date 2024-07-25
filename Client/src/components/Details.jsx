import './Details.css';
import { useState, } from 'react';
import { useParams } from 'react-router-dom';
import recipieAPI from '../api/recipies-api';
import Comments from './Comments';
import { useGetOneRecipe } from '../hooks/useRecipes';
// import commentsAPI from '../api/comments-api';

export default function Recipie() {
    const { recipieId } = useParams();
    const [recipie, setRecipie] = useGetOneRecipe(recipieId);
    // const [username, setUsername] = useState('');
    // const [comment, setComment] = useState('');

    // const commentSubmitHandler = async (e) => {
    //     e.preventDefault();

    //     const newComment = await commentsAPI.create(recipieId, username, comment);

    //     setRecipie(prevState => ({
    //         ...prevState,
    //         comments: {
    //             ...prevState.comments,
    //             [newComment._id]: newComment,
    //         }
    //     }));
    // }

    return (
        <>
            <div className="recipe-card-details">
            <div className='backBtn'>
                <button onClick={(e) => { e.preventDefault(); window.history.back(); }}>Go Back</button>
            </div>
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