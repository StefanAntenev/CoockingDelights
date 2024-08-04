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
    const { userId } = useAuthContext();
    const [recipie] = useGetOneRecipe(recipieId);
    const { isAuthenticated } = useAuthContext();
    const {
        changeHandler,
        submitHandler,
        values
    } = useForm(initialValues, async ({ comment }) => {
        try {
            const newComment = await createComment(recipieId, comment)

            setComments(oldComments => [...oldComments, newComment]);
            // dispatch({ type: 'ADD_COMMENT', comment: {...newComment, author: {email}} });
        } catch (err) {
            console.error(err.message)
        }
    });

    const isOwner = userId === recipie._ownerId

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
                {isOwner && (
                    <div>
                        <input href='#' className='button' value='Edit'></input>
                        <input href='#' className='button' value='Delete'></input>
                        <a></a>
                    </div>
                )}
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

            <div className="comments">
                <h2>Comments:</h2>
                <ul>
                        {comments.map(comment => (
                    <div className='separatecomment'>
                            <li key={comment._id}>
                                    <p>{comment.text}</p> {/*comment.author.email*/}
                            </li>
                    </div>
                        ))}
                </ul>
                {comments.length === 0 && <p>No comments yet</p>}
            </div>

            
        </>
    )
}