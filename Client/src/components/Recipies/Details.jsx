import './Details.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetOneRecipe } from '../../hooks/useRecipes';
import { useForm } from '../../hooks/useForm';
import { useCreateComment, useGetAllComments } from '../../hooks/useComments';
import { useAuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

import recipieAPI from '../../api/recipies-api';

const initialValues = {
    comment: ''
}

export default function Recipie() {
    const navigate = useNavigate();
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
            if (comment.trim() === '') {
                alert('Comment field must contain something');
                return;
            }
            setComments(oldComments => [...oldComments, newComment]);
            // dispatch({ type: 'ADD_COMMENT', comment: {...newComment, author: {email}} });
        } catch (err) {
            console.error(err.message)
        }
    });

    const recipieDeleteHandler = async () => {
        const isConfirmed = confirm(`Are you sure you want to delete the recipe for ${recipie.name}?`);

        if (isConfirmed) {
            try {
                await recipieAPI.remove(recipieId);

                navigate('/recipies');
            } catch (err) {
                console.error(err.message);
            }
        }
    }

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
                        <Link to={`/recipies/${recipieId}/edit`} className='button-edit'><button className='button-editdelete' value="Edit">Edit</button></Link>
                        <button onClick={recipieDeleteHandler} className='button-editdelete' value='Delete'>Delete</button>
                    </div>
                )}
            </div>

            <div className='comments-box'>
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
                                <li key={comment._id} className='li-element'>
                                    <p>{comment.author?.username}  :     {comment.text}</p> {/*comment.author.email - not working need to refresh to see user*/}
                                </li>
                            </div>
                        ))}
                    </ul>
                    {comments.length === 0 && <p>No comments yet</p>}
                </div>
            </div>


        </>
    )
}