import './Details.css';
import { useParams } from 'react-router-dom';
import { useGetOneRecipe } from '../hooks/useRecipes';
import { useForm } from '../hooks/useForm';
import { useCreateComment, useGetAllComments } from '../hooks/useComments';
import { useAuthContext } from '../contexts/AuthContext';

const initialValues = {
    comment: ''
}

export default function Recipie() {
    const { recipieId } = useParams();
    const [comments, setComments] = useGetAllComments(recipieId);
    const createComment = useCreateComment();
    const [recipie] = useGetOneRecipe(recipieId);
    const { isAuthenticated } = useAuthContext();
    const {
        changeHandler,
        submitHandler,
        values
    } = useForm(initialValues, ({ comment }) => {
        createComment(recipieId, comment);
    });


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

            <div className="comments">
                <h2>Comments:</h2>
                <ul>
                    {comments.map(comment => (
                        <li key={comment._id}>
                            <p>{comment.text}</p>
                        </li>
                    ))}
                </ul>
                {comments.length === 0 && <p>No comments yet</p>}
            </div>

            {isAuthenticated && (
                <article className='create-comment'>
                    <label>Add new comment:</label>
                    <form className="form" onSubmit={submitHandler}>
                        <textarea
                            name="comment"
                            placeholder="Enter your comment..."
                            onChange={changeHandler}
                            value={values.comment}
                        ></textarea>
                        <input className="btn-submit" type="submit" value="Add comment"></input>
                    </form>
                </article>
            )}
        </>
    )
}